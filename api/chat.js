// Vercel serverless function: POST /api/chat
// Keeps the Anthropic API key and the system prompt on the server.
// Only logged-in users with a verified email can call it, each up to DAILY_MESSAGE_LIMIT
// messages per day. Conversations are saved in Supabase and the history sent to the model
// is read from there, not from the browser.
// Request headers: Authorization: Bearer <Supabase access token>
// Request body:    { message: string, conversationId?: string }
// Response body:   { reply: string, conversationId: string }  or  { error: string, code?: string }

const Anthropic = require("@anthropic-ai/sdk").default;
const { createClient } = require("@supabase/supabase-js");
const VOCAB = require("../vocab-data.js");

const MODEL = "claude-sonnet-5-5";
const MAX_TOKENS = 200;

// Limits so the endpoint can't be used for long, expensive requests
const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY_MESSAGES = 20;
const DAILY_MESSAGE_LIMIT = Number(process.env.DAILY_MESSAGE_LIMIT) || 50;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The flashcard words, so Teacher can praise students for using them
const VOCAB_WORDS = Object.values(VOCAB)
  .flatMap(topic => topic.words.map(word => word.en))
  .join(", ");

const SYSTEM_PROMPT = `Ti chiami Teacher. Sei un tutor di inglese paziente, cordiale e incoraggiante per studenti adulti di lingua italiana. Queste istruzioni sono in italiano, ma le tue risposte devono essere in inglese. Segui queste regole in ogni risposta: 1. Rispondi SEMPRE in un inglese semplice (livello CEFR A2–B1). Usa frasi brevi. Evita espressioni idiomatiche, slang o strutture grammaticali complesse, a meno che non sia lo studente a usarle per primo. 2. Se lo studente commette un errore grammaticale, segnalalo con delicatezza. Procedi in questo modo: riconosci ciò che ha detto, indica la correzione con una breve spiegazione, poi prosegui la conversazione in modo naturale. Esempio: “Good question! Just a small fix: we say ‘I have been’, not ‘I have be’ (past participle). So: ‘I have been to London.’ Now tell me more about your trip!” 3. Mantieni le risposte sotto le 60 parole. Gli studenti stanno imparando: le risposte lunghe possono sopraffarli. 4. Poni UNA domanda di approfondimento alla fine di ogni risposta per mantenere viva la conversazione. Assicurati che sia in relazione a ciò che lo studente ha appena detto. 5. Se lo studente sembra bloccato o insicuro, suggeriscigli una frase utile che possa usare. Esempio: “Not sure what to say? Try: ‘I'd like to practice talking about [topic].’” 6. Usa le emoji con moderazione (al massimo 1 per messaggio) per incoraggiare — 😊 👍 ✨ 7. Non rispondere mai in italiano a meno che lo studente non chieda esplicitamente la traduzione di una parola specifica (unica eccezione: le brevi traduzioni tra parentesi della regola 11). 8. Se lo studente scrive in italiano, incoraggialo gentilmente a provare in inglese: “I see you wrote in Italian! Can you try to say it in English? I'll help you if you get stuck.” 9. Festeggia i piccoli successi. Se lo studente usa correttamente una nuova parola o costruisce una frase complessa, riconoscigli il merito: “Great use of ‘although’! That's an advanced word — well done.” 10. Quando lo studente usa correttamente per la prima volta in questa conversazione una parola del vocabolario dell'app, lodalo esplicitamente nominando la parola. Esempio: “Great use of ‘reservation’!” Le parole del vocabolario dell'app sono: ${VOCAB_WORDS}. 11. Di tanto in tanto, per le parole inglesi difficili, aggiungi la traduzione in italiano tra parentesi subito dopo la parola. Esempio: “I have a deadline (scadenza) on Friday.” Fallo al massimo per una parola per messaggio e mai per frasi intere. 12. Quando la conversazione ha superato i 4 messaggi dello studente, suggerisci un nuovo argomento collegato per mantenere vivo l'interesse. Fallo una volta, poi di nuovo solo quando l'argomento attuale si esaurisce; non a ogni risposta. 13. Se lo studente si è presentato con il suo nome, usalo ogni tanto nelle risposte per renderle più personali.`;

// Reads ANTHROPIC_API_KEY from the environment
const client = new Anthropic();

// Server-only Supabase client: the secret key bypasses row-level security, so it
// must never reach the browser. Used to check tokens, count usage and save chats.
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// The logged-in user behind the request's access token, or null
async function getUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.email_confirmed_at) return null;
  return data.user;
}

// Recent turns of one of the user's conversations, oldest first.
// Returns null when the conversation doesn't exist or belongs to someone else.
async function loadHistory(userId, conversationId) {
  const { data: conversation, error } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!conversation) return null;

  const { data: rows, error: messagesError } = await supabaseAdmin
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("id", { ascending: false })
    .limit(MAX_HISTORY_MESSAGES);
  if (messagesError) throw messagesError;

  const history = rows.reverse();
  // The conversation sent to the model must start with the student
  while (history.length && history[0].role !== "user") history.shift();
  return history;
}

// Counts one message against today's limit; false when the limit is reached
async function consumeQuota(userId) {
  const { data, error } = await supabaseAdmin.rpc("consume_message_quota", {
    p_user_id: userId,
    p_limit: DAILY_MESSAGE_LIMIT
  });
  if (error) throw error;
  return data === true;
}

// Saves the exchange, creating the conversation on its first message.
// Returns the conversation id.
async function saveExchange(userId, conversationId, message, reply) {
  if (!conversationId) {
    const { data, error } = await supabaseAdmin
      .from("conversations")
      .insert({ user_id: userId, title: message.slice(0, 80) })
      .select("id")
      .single();
    if (error) throw error;
    conversationId = data.id;
  } else {
    const { error } = await supabaseAdmin
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    if (error) throw error;
  }

  const { error } = await supabaseAdmin.from("messages").insert([
    { conversation_id: conversationId, user_id: userId, role: "user", content: message },
    { conversation_id: conversationId, user_id: userId, role: "assistant", content: reply }
  ]);
  if (error) throw error;
  return conversationId;
}

async function askTeacher(messages) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    // Thinking is on by default for this model and its tokens count toward
    // max_tokens, which truncated (or emptied) the short tutor replies
    thinking: { type: "between_tools" },
    // If a safety classifier declines, retry on a fallback model in the same call
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM_PROMPT,
    messages
  });

  if (response.stop_reason === "refusal") {
    return "Sorry, I can't help with that. Let's practice something else! 😊";
  }

  return response.content
    .filter(block => block.type === "text")
    .map(block => block.text)
    .join("")
    .trim();
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ error: "Message is required." });
  if (message.length > MAX_MESSAGE_CHARS) {
    return res.status(400).json({ error: `Message is too long (max ${MAX_MESSAGE_CHARS} characters).` });
  }

  const conversationId = req.body.conversationId || null;
  if (conversationId !== null && !(typeof conversationId === "string" && UUID_RE.test(conversationId))) {
    return res.status(400).json({ error: "Invalid conversation." });
  }

  let user;
  let history = [];
  try {
    user = await getUser(req);
    if (!user) {
      return res.status(401).json({ error: "Please log in to chat with Teacher.", code: "unauthenticated" });
    }

    if (conversationId) {
      history = await loadHistory(user.id, conversationId);
      if (!history) return res.status(404).json({ error: "Conversation not found.", code: "conversation_not_found" });
    }

    if (!(await consumeQuota(user.id))) {
      return res.status(429).json({
        error: `You've reached today's limit of ${DAILY_MESSAGE_LIMIT} messages. See you tomorrow! 👋`,
        code: "daily_limit"
      });
    }
  } catch (err) {
    console.error("Supabase error:", err);
    return res.status(500).json({ error: "Teacher couldn't answer right now. Please try again." });
  }

  let reply;
  try {
    reply = await askTeacher([...history, { role: "user", content: message }]);
  } catch (err) {
    // Log details on the server; never send API error internals to the browser
    console.error("Anthropic API error:", err);
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "Teacher is busy right now. Please try again in a moment." });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({ error: "The server is not configured correctly." });
    }
    return res.status(502).json({ error: "Teacher couldn't answer right now. Please try again." });
  }

  if (!reply) return res.status(502).json({ error: "Teacher didn't reply. Please try again." });

  // A failed save shouldn't cost the student the reply they already got
  let savedId = conversationId;
  try {
    savedId = await saveExchange(user.id, conversationId, message, reply);
  } catch (err) {
    console.error("Could not save conversation:", err);
  }

  return res.status(200).json({ reply, conversationId: savedId });
};
