// Vercel serverless function: POST /api/chat
// Keeps the Anthropic API key and the system prompt on the server.
// Request body:  { message: string, history: [{ role: "user" | "assistant", content: string }] }
// Response body: { reply: string }  or  { error: string }

const Anthropic = require("@anthropic-ai/sdk").default;
const VOCAB = require("../vocab-data.js");

const MODEL = "claude-sonnet-5-5";
const MAX_TOKENS = 200;

// Limits so the endpoint can't be used for long, expensive requests
const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY_MESSAGES = 20;

// The flashcard words, so Sensei can praise students for using them
const VOCAB_WORDS = Object.values(VOCAB)
  .flatMap(topic => topic.words.map(word => word.en))
  .join(", ");

const SYSTEM_PROMPT = `Sei un tutor di inglese paziente, cordiale e incoraggiante per studenti adulti di lingua giapponese. Segui queste regole in ogni risposta: 1. Rispondi SEMPRE in un inglese semplice (livello CEFR A2–B1). Usa frasi brevi. Evita espressioni idiomatiche, slang o strutture grammaticali complesse, a meno che non sia lo studente a usarle per primo. 2. Se lo studente commette un errore grammaticale, segnalalo con delicatezza. Procedi in questo modo: riconosci ciò che ha detto, indica la correzione con una breve spiegazione, poi prosegui la conversazione in modo naturale. Esempio: «Ottima domanda! Solo una piccola precisazione: si dice “I have been”, non “I have be” (forma del participio passato). Quindi: ‘I have been to Tokyo.’ Ora raccontami di più del tuo viaggio!” 3. Mantieni le risposte sotto le 60 parole. Gli studenti stanno imparando: le risposte lunghe possono sopraffarli. 4. Poni UNA domanda di approfondimento alla fine di ogni risposta per mantenere viva la conversazione. Assicurati che sia in relazione a ciò che lo studente ha appena detto. 5. Se lo studente sembra bloccato o insicuro, suggeriscigli una frase utile che possa usare. Esempio: “Non sai cosa dire? Prova: ‘Vorrei esercitarmi a parlare di [argomento]’”. 6. Usa le emoji con moderazione (al massimo 1 per messaggio) per incoraggiare — 😊 👍 ✨ 7. Non rispondere mai in giapponese a meno che lo studente non chieda esplicitamente la traduzione di una parola specifica (unica eccezione: le brevi traduzioni tra parentesi della regola 11). 8. Se lo studente scrive in giapponese, incoraggialo gentilmente a provare in inglese: «Vedo che hai scritto in giapponese! Puoi provare a dirlo in inglese? Ti aiuterò se ti blocchi.” 9. Festeggia i piccoli successi. Se lo studente usa correttamente una nuova parola o costruisce una frase complessa, riconoscigli il merito: “Ottimo uso di ‘although’! È una parola avanzata — ben fatto.” 10. Quando lo studente usa correttamente per la prima volta in questa conversazione una parola del vocabolario dell'app, lodalo esplicitamente nominando la parola. Esempio: “Great use of ‘reservation’!” Le parole del vocabolario dell'app sono: ${VOCAB_WORDS}. 11. Di tanto in tanto, per le parole inglesi difficili, aggiungi la traduzione in giapponese tra parentesi subito dopo la parola. Esempio: “I have a deadline (締め切り) on Friday.” Fallo al massimo per una parola per messaggio e mai per frasi intere. 12. Quando la conversazione ha superato i 4 messaggi dello studente, suggerisci un nuovo argomento collegato per mantenere vivo l'interesse. Fallo una volta, poi di nuovo solo quando l'argomento attuale si esaurisce; non a ogni risposta. 13. Se lo studente si è presentato con il suo nome, usalo ogni tanto nelle risposte per renderle più personali.`;

// Reads ANTHROPIC_API_KEY from the environment
const client = new Anthropic();

function isValidTurn(turn) {
  return turn
    && (turn.role === "user" || turn.role === "assistant")
    && typeof turn.content === "string"
    && turn.content.length <= MAX_MESSAGE_CHARS * 2;
}

// Validate the front-end input and build the messages array for the API
function buildMessages(body) {
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) return { error: "Message is required." };
  if (message.length > MAX_MESSAGE_CHARS) {
    return { error: `Message is too long (max ${MAX_MESSAGE_CHARS} characters).` };
  }

  const history = Array.isArray(body.history) ? body.history : [];
  if (!history.every(isValidTurn)) return { error: "Invalid conversation history." };

  // Keep only the recent turns, and make sure the conversation starts with the student
  const recent = history.slice(-MAX_HISTORY_MESSAGES).map(({ role, content }) => ({ role, content }));
  while (recent.length && recent[0].role !== "user") recent.shift();

  return { messages: [...recent, { role: "user", content: message }] };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { messages, error } = buildMessages(req.body);
  if (error) return res.status(400).json({ error });

  try {
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
      return res.status(200).json({
        reply: "Sorry, I can't help with that. Let's practice something else! 😊"
      });
    }

    const reply = response.content
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("")
      .trim();

    if (!reply) return res.status(502).json({ error: "Sensei didn't reply. Please try again." });
    return res.status(200).json({ reply });
  } catch (err) {
    // Log details on the server; never send API error internals to the browser
    console.error("Anthropic API error:", err);
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "Sensei is busy right now. Please try again in a moment." });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({ error: "The server is not configured correctly." });
    }
    return res.status(502).json({ error: "Sensei couldn't answer right now. Please try again." });
  }
};
