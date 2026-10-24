// Vercel serverless function: GET /api/config
// Gives the browser the public Supabase settings, read from environment variables so
// nothing is hard-coded in the pages. The publishable key is designed to be public:
// row-level security in the database decides what it can read.
// Never return SUPABASE_SECRET_KEY or ANTHROPIC_API_KEY from here.

module.exports = function handler(req, res) {
  // Settings can change with a redeploy, so never let the browser reuse an old answer
  res.setHeader("Cache-Control", "no-store");

  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, AUTH_GOOGLE_ENABLED } = process.env;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return res.status(500).json({ error: "Login is not configured on the server." });
  }

  // Only the origin (https://<project>.supabase.co): a pasted ".../rest/v1/" breaks every call
  let supabaseUrl;
  try {
    supabaseUrl = new URL(SUPABASE_URL).origin;
  } catch {
    return res.status(500).json({ error: "SUPABASE_URL on the server is not a valid URL." });
  }

  return res.status(200).json({
    supabaseUrl,
    supabaseKey: SUPABASE_PUBLISHABLE_KEY,
    googleEnabled: AUTH_GOOGLE_ENABLED === "true"
  });
};
