(function () {
  const rules = [
    [/middle school/, "graduation-cap"],
    [/village temples/, "church"],
    [/fish farming ponds/, "fish-symbol"],
    [/agriculture and irrigation/, "wheat"],
    [/kissan help/, "sprout"],
    [/health services/, "heart-pulse"],
    [/local market/, "store"],
    [/^banking\b/, "landmark"],
    [/panchayat services/, "building-2"],
    [/aadhaar/, "fingerprint"],
    [/pan card/, "credit-card"],
    [/kyc/, "shield-check"],
    [/bank account/, "landmark"],
    [/mobile number|mobile recharge/, "smartphone"],
    [/birth certificate/, "baby"],
    [/caste certificate/, "badge-check"],
    [/income certificate/, "indian-rupee"],
    [/residence certificate/, "house"],
    [/voter/, "vote"],
    [/ration/, "shopping-basket"],
    [/pension/, "accessibility"],
    [/scholarship/, "graduation-cap"],
    [/pm kisan/, "wheat"],
    [/land records|bhumi|jamabandi|lagaan|mutation/, "map"],
    [/electricity/, "zap"],
    [/water bill/, "droplets"],
    [/dth/, "satellite-dish"],
    [/print|scan|photocopy/, "printer"],
    [/email/, "mail"],
    [/train/, "train-front"],
    [/flight/, "plane"],
    [/bus ticket/, "bus-front"],
    [/insurance/, "shield-check"],
    [/money transfer/, "send"],
    [/resume|document preparation/, "file-user"],
    [/fish|pond/, "fish-symbol"],
    [/temple|मंदिर/, "church"],
    [/gas/, "flame"],
    [/home|मुखपृष्ठ|होम/, "house"],
    [/about|हमारे बारे|गाँव के बारे|village history/, "landmark"],
    [/service|सेवा|सुविधा|facility/, "hand-helping"],
    [/kissan|kisan|farmer|किसान|खेती|crop|agri/, "sprout"],
    [/gallery|photo|image|गैलरी|तस्वीर/, "images"],
    [/notice|notification|सूचना|update/, "bell-ring"],
    [/contact|phone|call|संपर्क/, "phone"],
    [/map|direction|location|स्थान|पता/, "map-pin"],
    [/upload|अपलोड/, "upload-cloud"],
    [/share|शेयर/, "share-2"],
    [/copy|कॉपी/, "copy"],
    [/like|पसंद/, "heart"],
    [/search|खोज/, "search"],
    [/bank|बैंक|payment|bill/, "landmark"],
    [/school|education|शिक्षा|विद्यालय/, "graduation-cap"],
    [/health|hospital|स्वास्थ्य/, "heart-pulse"],
    [/panchayat|government|सरकार|certificate|प्रमाण/, "building-2"],
    [/market|shop|बाजार/, "store"],
    [/online|digital|portal|website|वेबसाइट/, "globe-2"],
    [/download|डाउनलोड/, "download"],
    [/previous|back|पिछला/, "arrow-left"],
    [/next|आगे/, "arrow-right"],
    [/close|बंद/, "x"],
    [/submit|send|भेज/, "send"],
    [/explore|read|view|open|देख|जान/, "arrow-up-right"]
  ];

  function iconFor(element, fallback) {
    const assigned = element.dataset.icon || element.closest("[data-icon]")?.dataset.icon;
    if (assigned) return assigned;
    const value = `${element.textContent || ""} ${element.getAttribute("href") || ""} ${element.getAttribute("aria-label") || ""}`.toLowerCase();
    const match = rules.find(([pattern]) => pattern.test(value));
    return match ? match[1] : fallback;
  }

  function addIcon(element, iconName, className = "ui-icon") {
    if (!element || element.querySelector(":scope > svg.lucide, :scope > i[data-lucide]")) return;
    const icon = document.createElement("i");
    icon.dataset.lucide = iconName;
    icon.className = className;
    icon.setAttribute("aria-hidden", "true");
    element.prepend(icon);
  }

  function enhanceIcons() {
    if (!window.lucide) return;

    document.querySelectorAll(".site-nav a, .gallery-nav a, .main-nav a, .nav-links a").forEach((link) => addIcon(link, iconFor(link, "circle")));
    document.querySelectorAll(".btn, .text-link, .back-link, .service-filter, .upload-button, .site-like-button, .lightbox-close, .lightbox-arrow, button").forEach((control) => addIcon(control, iconFor(control, "arrow-up-right")));
    document.querySelectorAll(".footer-links a, .social-link-row a, .official-links a").forEach((link) => addIcon(link, iconFor(link, "link"), "link-icon"));

    document.querySelectorAll(".service-card h3, .feature-card h3, .notice-card h3, .contact-card h3, .connect-card h3, .govt-portal-card h3").forEach((heading) => {
      addIcon(heading, iconFor(heading.closest("article, div") || heading, "badge-info"), "card-icon");
    });
    document.querySelectorAll(".online-services-list li").forEach((item) => addIcon(item, iconFor(item, "circle-check"), "service-list-icon"));

    const menuButton = document.querySelector(".menu-toggle");
    if (menuButton) addIcon(menuButton, menuButton.getAttribute("aria-expanded") === "true" ? "x" : "menu");

    window.lucide.createIcons({ attrs: { "stroke-width": 1.9 } });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhanceIcons);
  else enhanceIcons();

  document.addEventListener("change", (event) => {
    if (event.target.matches(".language-switcher select")) setTimeout(enhanceIcons, 0);
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest(".menu-toggle")) setTimeout(enhanceIcons, 0);
  });
})();
