(function noticeBoardModule(root) {
  "use strict";

  const categories = {
    panchayat: "Panchayat Notices", education: "Education", schemes: "Government Schemes",
    agriculture: "Agriculture", health: "Health", utilities: "Electricity and Water",
    employment: "Employment", culture: "Social and Cultural Events", important: "Important Announcements", other: "Other Notices"
  };
  const text = (value) => typeof value === "string" ? value.trim() : "";
  const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const validDate = (value) => {
    if (!value) return "";
    const raw = value instanceof Date ? value.toISOString() : text(value);
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "";
    if (!(typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))) return localDate(date);
    return value;
  };
  const safeUrl = (value) => {
    const url = text(value);
    if (!url) return "";
    try {
      const parsed = new URL(url, root.location?.href || "https://lagma.online/");
      if (!["https:", "http:"].includes(parsed.protocol)) return "";
      if (/^https?:\/\//i.test(url)) return parsed.href;
      return parsed.pathname + parsed.search + parsed.hash;
    } catch (_) { return ""; }
  };
  const normalize = (item, id) => {
    const category = text(item.category).toLowerCase();
    const doc = safeUrl(item.documentUrl);
    const source = safeUrl(item.sourceUrl);
    const tags = Array.isArray(item.tags) ? item.tags.map(text).filter(Boolean) : [];
    return {
      id: text(item.id || id || item.slug), slug: text(item.slug), title: text(item.title),
      summary: text(item.summary || item.message), content: text(item.content || item.message || item.summary),
      category: categories[category] ? category : "other", publishDate: validDate(item.publishDate), updatedAt: validDate(item.updatedAt),
      startDate: validDate(item.startDate), expiryDate: validDate(item.expiryDate),
      archived: text(item.status).toLowerCase() === "archived", pinned: item.pinned === true || text(item.priority).toLowerCase() === "important", community: item.community === true,
      organization: text(item.issuingOrganization), sourceName: text(item.sourceName), sourceUrl: source,
      documentUrl: doc, documentType: text(item.documentType), language: text(item.language), tags
    };
  };
  const stateOf = (item, today = localDate(new Date())) => {
    if (item.archived) return "archived";
    if (item.startDate && item.startDate > today) return "upcoming";
    if (item.expiryDate && item.expiryDate < today) return "expired";
    if ((item.startDate && item.startDate <= today) || (item.expiryDate && item.expiryDate >= today)) return "active";
    return "undated";
  };
  const haystack = (item) => [item.title, item.summary, item.content, categories[item.category], item.organization, ...item.tags].join(" ").toLocaleLowerCase();
  const matches = (item, filters, today) => {
    const q = text(filters.query).toLocaleLowerCase();
    const state = stateOf(item, today);
    const status = filters.status || "all";
    return (!q || haystack(item).includes(q)) && (filters.category === "all" || !filters.category || item.category === filters.category) &&
      (status === "all" || (status === "important" ? item.pinned : status === "active" ? state === "active" : state === status)) &&
      (!filters.from || !item.publishDate || item.publishDate >= filters.from) && (!filters.to || !item.publishDate || item.publishDate <= filters.to);
  };
  const sortItems = (items, sort) => [...items].sort((a, b) => {
    const field = sort === "oldest" ? "publishDate" : sort === "updated" ? "updatedAt" : sort === "upcoming" ? "startDate" : "publishDate";
    const direction = sort === "oldest" || sort === "upcoming" ? 1 : -1;
    return ((a[field] || "") < (b[field] || "") ? -1 : (a[field] || "") > (b[field] || "") ? 1 : 0) * direction || a.title.localeCompare(b.title);
  });
  root.LagmaNoticeTools = Object.freeze({ categories, safeUrl, normalize, stateOf, matches, sortItems });

  const init = () => {
    const list = document.querySelector("#notice-list");
    if (!list) return;
    root.LagmaNoticeBoard = true;
    const $ = (selector) => document.querySelector(selector);
    const initial = (root.LAGMA_STATIC_NOTICES || []).map((item) => normalize(item));
    const PAGE_SIZE = 8;
    let notices = [...initial];
    let visibleLimit = PAGE_SIZE;
    let status = "all";
    let cloudLoaded = false;
    let cloudError = false;
    let pendingCloud = [];
    const cache = new Map(notices.map((item) => [item.id, item]));

    const filters = () => ({ query: $("#notice-search")?.value || "", category: $("#notice-category-filter")?.value || "all", from: $("#notice-date-from")?.value || "", to: $("#notice-date-to")?.value || "", status });
    const dateLabel = (value) => value ? new Date(value + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
    const element = (tag, className, value) => { const node = document.createElement(tag); if (className) node.className = className; if (value) node.textContent = value; return node; };
    const makeLink = (label, url, className = "btn btn-outline") => {
      const href = safeUrl(url); if (!href) return null;
      const link = element("a", className, label); link.href = href;
      if (/^https?:\/\//i.test(href)) { link.target = "_blank"; link.rel = "noopener noreferrer"; }
      return link;
    };
    const card = (item) => {
      const article = element("article", `notice-card${item.pinned ? " highlight-notice" : ""}`);
      article.dataset.noticeId = item.id;
      const badges = element("div", "notice-badges");
      badges.append(element("span", "notice-category", categories[item.category] || categories.other));
      if (item.community) badges.append(element("span", "notice-community-badge", "Approved community submission"));
      if (item.pinned) badges.append(element("span", "notice-pin-badge", "Pinned important notice"));
      const state = stateOf(item);
      if (state !== "undated") badges.append(element("span", `notice-state notice-state-${state}`, state[0].toUpperCase() + state.slice(1)));
      article.append(badges);
      const title = element("h3", "", item.title); title.setAttribute("translate", "no"); article.append(title);
      if (item.summary) { const summary = element("p", "", item.summary); summary.setAttribute("translate", "no"); article.append(summary); }
      const meta = element("p", "notice-meta");
      if (item.publishDate) meta.append(element("span", "", `Published ${dateLabel(item.publishDate)}`));
      else if (item.publishLabel) meta.append(element("span", "", item.publishLabel));
      if (item.updatedAt) meta.append(element("span", "", `Updated ${dateLabel(item.updatedAt)}`));
      if (item.expiryDate) meta.append(element("span", "", `Expires ${dateLabel(item.expiryDate)}`));
      if (item.organization) meta.append(element("span", "", item.organization));
      if (meta.childNodes.length) article.append(meta);
      const actions = element("div", "notice-card-actions");
      const read = element("a", "btn", "Read details"); read.href = `?notice=${encodeURIComponent(item.id)}`; read.dataset.noticeOpen = item.id; actions.append(read);
      const pdf = makeLink(item.documentType ? `Open ${item.documentType}` : "Open document", item.documentUrl);
      if (pdf) actions.append(pdf);
      const share = element("button", "btn btn-outline", "Share"); share.type = "button"; share.dataset.noticeShare = item.id; actions.append(share);
      article.append(actions);
      return article;
    };
    const sortedMatches = () => {
      const f = filters();
      return sortItems(notices.filter((item) => matches(item, f)), $("#notice-sort")?.value || "newest");
    };
    const render = () => {
      const found = sortedMatches();
      const pinned = found.filter((item) => item.pinned);
      const normal = found.filter((item) => !item.pinned);
      const pinnedSection = $("#pinned-notices");
      const pinnedList = $("#pinned-notice-list");
      pinnedSection.hidden = pinned.length === 0;
      pinnedList.replaceChildren(...pinned.map(card));
      const shown = normal.slice(0, visibleLimit);
      list.replaceChildren(...shown.map(card));
      list.setAttribute("aria-busy", "false");
      $("#notice-empty").hidden = found.length !== 0;
      $("#notice-load-more").hidden = normal.length <= visibleLimit;
      $("#notice-load-more").textContent = `Load more notices (${Math.max(0, normal.length - visibleLimit)} remaining)`;
      $("#clear-notice-search").hidden = !text($("#notice-search").value);
      $("#notice-results-count").textContent = `${found.length} ${found.length === 1 ? "notice" : "notices"} match${found.length === 1 ? "es" : ""}${cloudLoaded ? "" : " from the available published list"}.`;
      const statusNode = $("#notice-board-status");
      statusNode.textContent = cloudError ? "Approved online notices could not load. Showing static notices only; counts are partial." : cloudLoaded ? "Showing static notices and the latest approved community notices. Counts reflect the notices currently loaded." : "Loading approved online notices. Counts currently reflect the static notices available on this page.";
      statusNode.classList.toggle("is-error", cloudError);
      $("#notice-retry").hidden = !cloudError;
      updateSummary();
    };
    const updateSummary = () => {
      const values = { total: notices.length, active: 0, upcoming: 0, archived: 0 };
      notices.forEach((item) => { const state = stateOf(item); if (state === "active") values.active++; if (state === "upcoming") values.upcoming++; if (state === "archived") values.archived++; });
      $("#notice-count-total").textContent = String(values.total);
      $("#notice-count-active").textContent = String(values.active);
      $("#notice-count-upcoming").textContent = String(values.upcoming);
      $("#notice-count-archived").textContent = String(values.archived);
    };
    const showDetail = (item) => {
      const page = $("#notice-detail-content");
      page.replaceChildren(); page.removeAttribute("translate");
      const title = element("h1", "", item.title); title.id = "notice-detail-title"; title.tabIndex = -1; title.setAttribute("translate", "no"); page.append(title);
      const badges = element("div", "notice-badges"); badges.append(element("span", "notice-category", categories[item.category] || categories.other));
      if (item.community) badges.append(element("span", "notice-community-badge", "Approved community submission"));
      if (item.pinned) badges.append(element("span", "notice-pin-badge", "Pinned important notice"));
      page.append(badges);
      const dates = [["Published", item.publishDate], ["Updated", item.updatedAt], ["Starts", item.startDate], ["Expires", item.expiryDate]];
      dates.filter(([, value]) => value).forEach(([label, value]) => page.append(element("p", "notice-meta", `${label}: ${dateLabel(value)}`)));
      if (item.organization) page.append(element("p", "", `Issuing organization: ${item.organization}`));
      const body = element("p", "notice-detail-body", item.content || item.summary || "No additional details are available."); body.setAttribute("translate", "no"); page.append(body);
      if (item.sourceName || item.sourceUrl) {
        const source = element("p", "notice-source", item.sourceName ? `Source: ${item.sourceName}` : "Original source");
        const link = makeLink("Open original source", item.sourceUrl); if (link) source.append(" ", link); page.append(source);
      }
      const documentLink = makeLink(item.documentType ? `Open ${item.documentType}` : "Open document", item.documentUrl);
      if (documentLink) { documentLink.setAttribute("aria-label", `${documentLink.textContent}: ${item.title}`); page.append(documentLink); }
      const related = notices.filter((other) => other.id !== item.id && other.category === item.category).slice(0, 3);
      $("#notice-related").hidden = related.length === 0;
      $("#notice-related-list").replaceChildren(...related.map((other) => { const link = element("a", "notice-related-link", other.title); link.href = `?notice=${encodeURIComponent(other.id)}`; link.dataset.noticeOpen = other.id; return link; }));
      $("#notice-share-status").textContent = "";
      $("#notice-copy-fallback-label").hidden = true;
      $("#notice-copy-fallback").value = "";
      $(".notice-detail-actions").hidden = false;
      $(".notice-section").classList.add("is-detail-view");
      $("#notice-detail").hidden = false;
      title.focus();
      if (!root.matchMedia?.("(prefers-reduced-motion: reduce)").matches) $("#notice-detail").scrollIntoView({ behavior: "smooth", block: "start" });
      document.title = `${item.title} | Lagma Village Notice Board`;
      if (root.history?.pushState && new URLSearchParams(root.location.search).get("notice") !== item.id) root.history.pushState({ noticeDetail: item.id }, "", `?notice=${encodeURIComponent(item.id)}`);
    };
    const showNotFound = () => {
      const page = $("#notice-detail-content"); page.replaceChildren(); page.removeAttribute("translate");
      const title = element("h1", "", "Notice not found"); title.id = "notice-detail-title"; title.tabIndex = -1; page.append(title);
      page.append(element("p", "", "This notice is unavailable, has been removed, or its link is invalid."));
      $("#notice-related").hidden = true; $(".notice-section").classList.add("is-detail-view"); $("#notice-detail").hidden = false;
      $(".notice-detail-actions").hidden = true; $("#notice-copy-fallback-label").hidden = true; $("#notice-share-status").textContent = "";
      title.focus();
      document.title = "Notice not found | Lagma Village";
    };
    const openFromUrl = async () => {
      const id = new URLSearchParams(root.location.search).get("notice");
      if (!id) return;
      let item = cache.get(id);
      if (!item && root.LAGMA_FIREBASE_CONFIG && root.LAGMA_FIREBASE_OPTIONS?.enabled) {
        try {
          const [{ initializeApp, getApp, getApps }, firestore] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
          ]);
          const config = root.LAGMA_FIREBASE_CONFIG;
          const app = getApps().length ? getApp() : initializeApp(config);
          const db = firestore.getFirestore(app);
          const snap = await firestore.getDoc(firestore.doc(db, root.LAGMA_FIREBASE_OPTIONS.notesCollection || "visitorNotes", id));
          if (snap.exists() && snap.data().status === "approved") { item = normalize({ ...snap.data(), id }); cache.set(id, item); notices.push(item); }
        } catch (_) { /* Keep safe not-found state when approved details cannot be fetched. */ }
      }
      if (item) showDetail(item); else showNotFound();
    };
    const closeDetail = () => {
      $("#notice-detail").hidden = true; $(".notice-section").classList.remove("is-detail-view");
      if (new URLSearchParams(root.location.search).has("notice")) root.history.pushState({}, "", root.location.pathname + root.location.hash);
      document.title = "Lagma Village Notice Board | Official Website";
      $("#notice-results-title").focus?.();
    };
    const pageUrl = (item) => `${root.location.origin}${root.location.pathname}?notice=${encodeURIComponent(item.id)}`;
    const shareNotice = async (item, copyOnly = false) => {
      const url = pageUrl(item); const statusNode = $("#notice-share-status");
      try {
        if (!copyOnly && root.navigator.share) await root.navigator.share({ title: item.title, text: item.summary || item.title, url });
        else if (root.navigator.clipboard?.writeText) { await root.navigator.clipboard.writeText(url); statusNode.textContent = "Notice link copied."; }
        else { $("#notice-copy-fallback").value = url; $("#notice-copy-fallback-label").hidden = false; $("#notice-copy-fallback").focus(); $("#notice-copy-fallback").select(); statusNode.textContent = "Select and copy the notice link shown above."; }
      } catch (_) { statusNode.textContent = "Sharing was cancelled or unavailable. You can copy the notice link instead."; $("#notice-copy-fallback").value = url; $("#notice-copy-fallback-label").hidden = false; }
    };

    document.querySelectorAll("[data-status-filter]").forEach((button) => button.addEventListener("click", () => {
      status = button.dataset.statusFilter; document.querySelectorAll("[data-status-filter]").forEach((node) => node.setAttribute("aria-pressed", String(node === button))); visibleLimit = PAGE_SIZE; render();
    }));
    ["#notice-search", "#notice-category-filter", "#notice-date-from", "#notice-date-to", "#notice-sort"].forEach((selector) => $(selector)?.addEventListener(selector === "#notice-search" ? "input" : "change", () => { visibleLimit = PAGE_SIZE; render(); }));
    $("#notice-search-form")?.addEventListener("submit", (event) => event.preventDefault());
    $("#clear-notice-search")?.addEventListener("click", () => { $("#notice-search").value = ""; visibleLimit = PAGE_SIZE; render(); $("#notice-search").focus(); });
    $("#clear-notice-filters")?.addEventListener("click", () => {
      $("#notice-search").value = ""; $("#notice-category-filter").value = "all"; $("#notice-date-from").value = ""; $("#notice-date-to").value = ""; $("#notice-sort").value = "newest";
      status = "all"; document.querySelectorAll("[data-status-filter]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.statusFilter === "all"))); visibleLimit = PAGE_SIZE; render();
    });
    $("#reset-notice-empty")?.addEventListener("click", () => $("#clear-notice-filters").click());
    $("#notice-load-more")?.addEventListener("click", () => { visibleLimit += PAGE_SIZE; render(); });
    $("#notice-retry")?.addEventListener("click", () => root.location.reload());
    $("#notice-back")?.addEventListener("click", closeDetail);
    $("#notice-print")?.addEventListener("click", () => root.print());
    $("#notice-copy-link")?.addEventListener("click", () => { const item = cache.get(new URLSearchParams(root.location.search).get("notice")); if (item) shareNotice(item, true); });
    $("#notice-share")?.addEventListener("click", () => { const item = cache.get(new URLSearchParams(root.location.search).get("notice")); if (item) shareNotice(item); });
    const noticeShareFallback = $("#notice-share-status");
    document.addEventListener("click", (event) => {
      const open = event.target.closest("[data-notice-open]");
      const share = event.target.closest("[data-notice-share]");
      if (open) { event.preventDefault(); const item = cache.get(open.dataset.noticeOpen); if (item) showDetail(item); }
      if (share) { const item = cache.get(share.dataset.noticeShare); if (item) { if (noticeShareFallback) noticeShareFallback.textContent = `Sharing ${item.title}`; shareNotice(item); } }
    });
    root.addEventListener("popstate", () => { const id = new URLSearchParams(root.location.search).get("notice"); if (id && cache.has(id)) showDetail(cache.get(id)); else closeDetail(); });

    const form = $("#visitor-note-form");
    if (form) {
      const key = "lagma-visitor-notes";
      const statusNode = $("#visitor-note-status");
      const localList = $("#local-note-list");
      const renderLocalNotes = () => {
        let saved = [];
        try { saved = JSON.parse(localStorage.getItem(key) || "[]"); } catch (_) { saved = []; }
        $("#local-note-section").hidden = saved.length === 0;
        localList.replaceChildren(...saved.map((note) => { const cardNode = element("article", "notice-card visitor-note-card"); cardNode.append(element("span", "", "Device-only draft"), element("h3", "", note.title), element("p", "", note.message)); return cardNode; }));
      };
      let sending = false; let cloudAddNote = null;
      const config = root.LAGMA_FIREBASE_CONFIG || {}; const options = root.LAGMA_FIREBASE_OPTIONS || {};
      const setFormStatus = (message, type) => { statusNode.textContent = message; statusNode.classList.toggle("error", type === "error"); statusNode.classList.toggle("success", type === "success"); };
      form.addEventListener("submit", async (event) => {
        event.preventDefault(); if (sending) return;
        const title = $("#visitor-note-title").value.trim(); const message = $("#visitor-note-message").value.trim(); const name = $("#visitor-note-name").value.trim();
        if (!title || title.length > 70 || !message || message.length > 300 || !$("#visitor-note-consent").checked) { setFormStatus("Title, note aur review consent zaroori hain. Kripya details jaanchein.", "error"); return; }
        sending = true; const submit = form.querySelector('[type="submit"]'); submit.disabled = true;
        try {
          if (cloudAddNote) {
            await cloudAddNote({ title, message, name }); form.reset(); setFormStatus("Aapka note review ke liye bhej diya gaya. Approval ke baad hi public hoga.", "success");
          } else {
            let saved = []; try { saved = JSON.parse(localStorage.getItem(key) || "[]"); } catch (_) { saved = []; }
            saved.unshift({ title, message, createdAt: new Date().toISOString() }); localStorage.setItem(key, JSON.stringify(saved.slice(0, 25))); form.reset(); renderLocalNotes();
            setFormStatus("Note sirf is device par save hua hai; submit nahi hua aur public nahi hai. Online approval service abhi uplabdh nahi.", "error");
          }
        } catch (_) { setFormStatus("Note review service par save nahi hua. Internet connection check karke dobara koshish karein.", "error"); }
        finally { sending = false; submit.disabled = false; }
      });
      $("#clear-visitor-notes")?.addEventListener("click", () => { localStorage.removeItem(key); renderLocalNotes(); setFormStatus("Is device ke notes clear ho gaye.", "success"); });
      renderLocalNotes();
      if (options.enabled === true && config.apiKey && config.projectId && config.appId) {
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js").then(async (appSdk) => {
          const firestore = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
          const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(config);
          const db = firestore.getFirestore(app); const approved = firestore.collection(db, options.notesCollection || "visitorNotes");
          cloudAddNote = (note) => firestore.addDoc(firestore.collection(db, options.pendingNotesCollection || "pendingVisitorNotes"), { ...note, page: "notification", status: "pending", createdAt: firestore.serverTimestamp() });
          const notesQuery = firestore.query(approved, firestore.orderBy("createdAt", "desc"), firestore.limit(50));
          firestore.onSnapshot(notesQuery, (snapshot) => {
            cloudLoaded = true; cloudError = false;
            const dynamic = snapshot.docs.map((doc) => { const data = doc.data(); const created = typeof data.createdAt?.toDate === "function" ? data.createdAt.toDate() : text(data.createdAt); return normalize({ ...data, id: doc.id, summary: data.message, content: data.message, publishDate: created, category: "other", community: true, status: data.status }); }).filter((item) => item.id && item.title && item.content);
            cache.clear(); initial.forEach((item) => cache.set(item.id, item)); dynamic.forEach((item) => cache.set(item.id, item));
            notices = [...initial, ...dynamic.filter((item) => !initial.some((base) => base.id === item.id))]; render();
          }, () => { cloudLoaded = false; cloudError = true; render(); });
        }).catch(() => { cloudError = true; render(); });
      } else { cloudError = true; }
    }
    render();
    openFromUrl();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})(typeof window === "undefined" ? globalThis : window);
