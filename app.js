// "Tisch für 15" – list, filters and "we've been here" marks.
// Visits are saved in this browser only (localStorage).
(function () {
  const R = window.RESTAURANTS || [];
  const AREAS = window.AREAS || ["All"];
  const state = { q: "", area: "All", vegOnly: false, direct: false, show: "all", sort: "area" };
  const STORE_KEY = "tisch15:visited";

  const $ = (s) => document.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v);
    }
    for (const c of kids) if (c) n.append(c);
    return n;
  };

  // visited = { restaurantId: "YYYY-MM-DD" }
  function loadVisited() {
    try {
      const v = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      return v && typeof v === "object" && !Array.isArray(v) ? v : {};
    } catch (_) { return {}; }
  }
  function saveVisited() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(visited)); } catch (_) {}
  }
  let visited = loadVisited();

  const today = () => new Date().toISOString().slice(0, 10);
  const fmtDate = (iso) => {
    const d = new Date(iso + "T12:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  function renderAreas() {
    const box = $("#areas");
    box.replaceChildren();
    for (const a of AREAS) {
      const b = el("button", { class: "chip", type: "button", "aria-pressed": String(state.area === a), text: a });
      b.onclick = () => { state.area = a; renderAreas(); render(); };
      box.append(b);
    }
  }

  function renderShow() {
    for (const b of document.querySelectorAll("#show .chip")) b.setAttribute("aria-pressed", String(b.dataset.show === state.show));
  }

  function toggleVisited(id) {
    if (visited[id]) delete visited[id]; else visited[id] = today();
    saveVisited();
    render();
  }

  function setDate(id, value) {
    if (!value) return;
    visited[id] = value;
    saveVisited();
    render();
  }

  function renderVisitedBar() {
    const n = R.filter((r) => visited[r.id]).length;
    $("#visitedText").textContent = n
      ? "You've been to " + n + " of " + R.length + " places."
      : "Tap “Mark as visited” after a dinner to keep track.";
  }

  function render() {
    const q = state.q.trim().toLowerCase();
    let rows = R.filter((r) =>
      (state.area === "All" || r.area === state.area) &&
      (!state.vegOnly || r.fullyVeg) &&
      (!state.direct || r.direct) &&
      (state.show === "all" || (state.show === "new" ? !visited[r.id] : !!visited[r.id])) &&
      (!q || [r.name, r.cuisine, r.addr, r.area].join(" ").toLowerCase().includes(q))
    );
    if (state.sort === "name") rows.sort((a, b) => a.name.localeCompare(b.name, "de"));
    else if (state.sort === "recent") rows.sort((a, b) => (visited[b.id] || "").localeCompare(visited[a.id] || "") || a.name.localeCompare(b.name, "de"));
    else rows.sort((a, b) => AREAS.indexOf(a.area) - AREAS.indexOf(b.area) || a.name.localeCompare(b.name, "de"));

    $("#count").textContent = rows.length + " of " + R.length + " places";
    renderVisitedBar();

    const list = $("#list");
    list.replaceChildren();
    if (!rows.length) {
      const msg = state.show === "been" ? "No visits marked yet. Tap “Mark as visited” on a place after you've eaten there."
        : state.show === "new" ? "You've been everywhere on the list. Time to add new places to data.js."
        : "No place matches. Clear a filter to see more.";
      list.append(el("p", { class: "empty", text: msg }));
      return;
    }
    for (const r of rows) {
      const been = visited[r.id];
      const badges = el("div", { class: "badges" });
      if (been) badges.append(el("span", { class: "b been", text: "✓ Been here · " + fmtDate(been) }));
      badges.append(el("span", { class: "b ok", text: "No card or no-show fee found" }));
      if (r.fullyVeg) badges.append(el("span", { class: "b veg", text: r.fullyVeg }));
      if (r.caution) badges.append(el("span", { class: "b warn", text: "Ask first" }));
      if (/not stated/i.test(r.group)) badges.append(el("span", { class: "b ask", text: "Groups: ask" }));

      const facts = el("dl", { class: "facts" },
        el("dt", { text: "Groups" }), el("dd", { text: r.group }),
        el("dt", { text: "Veggie" }), el("dd", { text: r.veg }),
        el("dt", { text: "Book" }), el("dd", { text: r.book }));

      const mark = el("button", { class: "btn mark", type: "button", "aria-pressed": String(!!been), text: been ? "✓ Visited" : "Mark as visited" });
      mark.title = been ? "Tap to remove the visit" : "Mark that your group has eaten here";
      mark.onclick = () => toggleVisited(r.id);
      const maps = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(r.name + ", " + r.addr + ", München");

      const actions = el("div", { class: "actions" },
        el("a", { class: "btn", href: r.url, target: "_blank", rel: "noopener", text: "Website ↗" }),
        el("a", { class: "btn", href: maps, target: "_blank", rel: "noopener", text: "Map ↗" }),
        mark);

      if (been) {
        const id = "date-" + r.id;
        const lbl = el("label", { class: "date", for: id, text: "Date " });
        const input = el("input", { type: "date", id: id, value: been, max: today() });
        input.onchange = (e) => setDate(r.id, e.target.value);
        lbl.append(input);
        actions.append(lbl);
      }

      list.append(el("article", { class: been ? "card is-been" : "card" },
        el("div", { class: "top" },
          el("div", {}, el("h2", { class: "name", text: r.name }), el("p", { class: "meta", text: r.cuisine + " · " + r.area + " · " + r.addr })),
          el("span", { class: "price", title: "Main courses", text: r.price === "not listed" ? "price not online" : r.price })),
        badges, facts,
        r.quote ? el("p", { class: "quote", text: r.quote }) : null,
        r.caution ? el("p", { class: "caution", text: r.caution }) : null,
        actions));
    }
  }

  function copyText(text, msgEl, selectEl) {
    const done = () => { msgEl.textContent = "Copied"; setTimeout(() => (msgEl.textContent = ""), 2000); };
    const fallback = () => {
      if (selectEl) {
        const range = document.createRange();
        range.selectNodeContents(selectEl);
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      }
      msgEl.textContent = "Select and copy manually";
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }

  function fillLists() {
    const out = window.EXCLUDED || [];
    const blocked = window.NOT_CHECKED || [];
    $("#outTitle").textContent = "Left out: card, fees, set menu or too pricey (" + out.length + ")";
    $("#blockedTitle").textContent = "Not checked: website blocks automatic reading (" + blocked.length + ")";
    $("#outList").replaceChildren();
    $("#blockedList").replaceChildren();
    for (const [n, why, u] of out) $("#outList").append(el("li", {}, el("a", { href: u, target: "_blank", rel: "noopener", text: n }), el("span", { text: ": " + why })));
    for (const n of blocked) $("#blockedList").append(el("li", { text: n }));
    $("#foot").textContent = "Checked on " + (window.CHECKED_ON || "") + " from each restaurant's own website. Prices are main courses from the current menu where it was readable. Visits are saved only in this browser.";
  }

  $("#q").addEventListener("input", (e) => { state.q = e.target.value; render(); });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  for (const k of ["vegOnly", "direct"]) {
    const b = $("#" + k);
    b.onclick = () => { state[k] = !state[k]; b.setAttribute("aria-pressed", String(state[k])); render(); };
  }
  for (const b of document.querySelectorAll("#show .chip")) {
    b.onclick = () => { state.show = b.dataset.show; renderShow(); render(); };
  }
  $("#copyAsk").onclick = () => copyText($("#askText").textContent, $("#copyMsg"), $("#askText"));
  $("#copyVisited").onclick = () => {
    const lines = R.filter((r) => visited[r.id])
      .sort((a, b) => visited[a.id].localeCompare(visited[b.id]))
      .map((r) => "✓ " + fmtDate(visited[r.id]) + ": " + r.name);
    copyText(lines.length ? "Where we've been:\n" + lines.join("\n") : "We haven't been anywhere on the list yet.", $("#visitedMsg"));
  };

  renderAreas();
  renderShow();
  fillLists();
  render();
})();
