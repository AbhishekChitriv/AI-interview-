/* JobJugad workflow nav — injected into every module page.
   Light top bar (logo + 4 stage tabs). Tabs unlock in order as each stage
   completes; the server enforces the same order via redirects. */
(function () {
  "use strict";

  var ICONS = {
    dashboard: '<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>',
    setup: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>',
    interview: '<path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/>',
    coding: '<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>',
    performance: '<path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z"/>'
  };

  var STEPS = [
    { key: "dashboard",   path: "/dashboard",   label: "Dashboard" },
    { key: "setup",       path: "/setup",       label: "Resume & JD Setup" },
    { key: "interview",   path: "/interview",   label: "AI Interview Live" },
    { key: "coding",      path: "/coding",      label: "Coding Round" },
    { key: "performance", path: "/performance", label: "Performance Report" }
  ];

  var elTabs = null;
  var lastCan = null;

  function here() {
    var p = location.pathname.replace(/\/+$/, "") || "/";
    for (var i = 0; i < STEPS.length; i++) if (STEPS[i].path === p) return STEPS[i].key;
    return "dashboard";
  }

  function unlocked(key, can) {
    return key === "dashboard" || key === "setup" ||
      (key === "interview" && can.interview) ||
      (key === "coding" && can.coding) ||
      (key === "performance" && can.performance);
  }

  function restartRun() {
    if (!confirm("Start a brand-new interview run? The current session is cleared.")) return;
    fetch("/api/session/reset", { method: "POST" }).then(function () { location.href = "/setup"; });
  }

  function build() {
    var bar = document.createElement("div");
    bar.id = "jj-nav";
    bar.innerHTML =
      '<a class="jj-logo" href="/dashboard">' +
        '<img src="/jj/avatar.jpg" alt="">' +
        '<span class="jj-logo-txt"><b>JOB<i>jugad</i></b><small>AI HR Interview Platform</small></span>' +
      '</a>' +
      '<nav class="jj-tabs"></nav>';
    elTabs = bar.querySelector(".jj-tabs");
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add("jj-shell-pad");
  }

  function render(session) {
    if (!elTabs) return;
    var can = (session && session.can) || { setup: true, interview: false, coding: false, performance: false };
    var cur = here();
    var canKey = JSON.stringify(can);

    elTabs.innerHTML = "";
    STEPS.forEach(function (s) {
      var ok = unlocked(s.key, can);
      var el = document.createElement(ok ? "a" : "span");
      el.className = "jj-tab" + (s.key === cur ? " jj-active" : "") + (ok ? "" : " jj-locked");
      if (ok) el.href = s.path;
      el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[s.key] + "</svg><span>" + s.label + "</span>";
      if (lastCan !== null && lastCan !== canKey && ok && s.key !== cur && s.key !== "dashboard" && s.key !== "setup") {
        el.classList.add("jj-justunlocked");
      }
      elTabs.appendChild(el);
    });
    lastCan = canKey;
  }

  function poll() {
    fetch("/api/session")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (s) { if (s) render(s); })
      .catch(function () {});
  }

  function boot() {
    build();
    poll();
    setInterval(poll, 3500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
