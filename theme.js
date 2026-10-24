// Shared light/dark theme. Loaded in <head> so the saved theme applies before
// the page paints (no flash of the wrong theme).
(function () {
  const THEME_KEY = "sensei.theme";
  const root = document.documentElement;

  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch {}

  // No saved choice yet: follow the device setting
  root.dataset.theme = saved === "dark" || saved === "light"
    ? saved
    : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  function syncButtons() {
    const dark = root.dataset.theme === "dark";
    document.querySelectorAll(".theme-toggle").forEach(btn => {
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      btn.setAttribute("aria-pressed", dark);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    syncButtons();
    document.querySelectorAll(".theme-toggle").forEach(btn => {
      btn.addEventListener("click", () => {
        root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
        try {
          localStorage.setItem(THEME_KEY, root.dataset.theme);
        } catch {}
        syncButtons();
      });
    });
  });
})();
