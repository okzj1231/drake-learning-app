// Shared login helpers (Supabase Auth). Load the supabase-js script before this file.
// Only public settings are used here; the server checks every chat request on its own.

// Pages a login may send the student back to (anything else could be an open redirect)
const AUTH_RETURN_PAGES = ["index.html", "profile.html", "dashboard.html", "vocab.html"];

let supabaseClientPromise = null;
let authConfig = null;

function getSupabase() {
  if (!supabaseClientPromise) {
    supabaseClientPromise = fetch("/api/config")
      .then(res => {
        if (!res.ok) throw new Error("Login is not available right now.");
        return res.json();
      })
      .then(config => {
        authConfig = config;
        return supabase.createClient(config.supabaseUrl, config.supabaseKey);
      });
    // Let a later call try again after a network error
    supabaseClientPromise.catch(() => { supabaseClientPromise = null; });
  }
  return supabaseClientPromise;
}

async function getAuthConfig() {
  await getSupabase();
  return authConfig;
}

async function getSession() {
  const sb = await getSupabase();
  const { data } = await sb.auth.getSession();
  return data.session;
}

function currentPageName() {
  return location.pathname.split("/").pop() || "index.html";
}

// "index.html?c=123" stays as is; anything not on the list falls back to the dashboard
function safeReturnPage(next) {
  const [page, query] = String(next || "").split("?");
  if (!AUTH_RETURN_PAGES.includes(page)) return "dashboard.html";
  return query ? `${page}?${query}` : page;
}

// Sends the visitor to the login page, coming back here afterwards.
// Never resolves, so the calling code stops there.
function redirectToLogin() {
  const next = currentPageName() + location.search;
  location.replace(`login.html?next=${encodeURIComponent(next)}`);
  return new Promise(() => {});
}

// True when this browser holds a Supabase login from an earlier visit
function hasStoredSession() {
  try {
    return Object.keys(localStorage).some(key => /^sb-.+-auth-token$/.test(key));
  } catch {
    return false;
  }
}

// For pages only logged-in students may see. Resolves with the session, or sends the
// visitor to the login page. With allowOffline, a device that has logged in before may
// stay on the page while offline (resolves with null), because the session can't be
// checked without a connection. Never use it for pages that show account data.
async function requireAuth({ allowOffline = false } = {}) {
  let session = null;
  try {
    session = await getSession();
  } catch {}
  if (session) return session;
  if (allowOffline && !navigator.onLine && hasStoredSession()) return null;
  return redirectToLogin();
}

// The server rejected our session (expired, revoked...): forget it and log in again
async function handleUnauthorized() {
  try {
    const sb = await getSupabase();
    await sb.auth.signOut({ scope: "local" });
  } catch {}
  return redirectToLogin();
}

// Display name from sign-up (full_name) or from the Google profile (name)
function displayName(user) {
  const meta = user?.user_metadata || {};
  return meta.full_name || meta.name || user?.email?.split("@")[0] || "";
}

async function signOut() {
  const sb = await getSupabase();
  await sb.auth.signOut();
  location.replace("login.html");
}
