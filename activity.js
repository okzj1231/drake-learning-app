// Shared activity tracking for the streak counter (used by every page)
const ACTIVITY_KEY = "sensei.activity.days";

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function readActivityDays() {
  try {
    const days = JSON.parse(localStorage.getItem(ACTIVITY_KEY));
    return Array.isArray(days) ? days : [];
  } catch {
    return [];
  }
}

// Call whenever the student does something that counts as practice
function recordActivity() {
  const days = readActivityDays();
  const today = localDateKey();
  if (days.includes(today)) return;
  days.push(today);
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(days.slice(-400)));
  } catch {}
}

// Consecutive active days ending today (or yesterday, if today has no activity yet)
function getStreak() {
  const days = new Set(readActivityDays());
  const cursor = new Date();
  if (!days.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
