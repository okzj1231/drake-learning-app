// Vercel serverless function: GET /api/config
// Gives the browser the public Supabase settings, read from environment variables so
// nothing is hard-coded in the pages. The publishable key is designed to be public:
// row-level security in the database decides what it can read.
// Never return SUPABASE_SECRET_KEY or ANTHROPIC_API_KEY from here.

module.exports = function handler(req, res) {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, AUTH_GOOGLE_ENABLED } = process.env;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return res.status(500).json({ error: "Login is not configured on the server." });
  }

  res.setHeader("Cache-Control", "public, max-age=300");
  return res.status(200).json({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_PUBLISHABLE_KEY,
    googleEnabled: AUTH_GOOGLE_ENABLED === "true"
  });
};
