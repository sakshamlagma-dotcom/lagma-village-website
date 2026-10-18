(function exposeNoticeData(root) {
  "use strict";

  root.LAGMA_STATIC_NOTICES = Object.freeze([
    Object.freeze({
      id: "lagma-website-live",
      slug: "lagma-website-live",
      title: "Lagma Village website is live",
      summary: "Residents can use this website to learn about village history, services, gallery updates, and contact information.",
      content: "Residents can use this website to learn about village history, services, gallery updates, and contact information.",
      category: "other",
      publishLabel: "Welcome",
      status: "published",
      priority: "normal",
      pinned: true,
      language: "en"
    }),
    Object.freeze({
      id: "development-meeting",
      slug: "development-meeting",
      title: "Development meeting",
      summary: "Discussion planned around roads, drainage, education, and village cleanliness.",
      content: "Discussion planned around roads, drainage, education, and village cleanliness.",
      category: "panchayat",
      publishLabel: "May 2026",
      status: "published",
      priority: "normal",
      pinned: false,
      language: "en"
    }),
    Object.freeze({
      id: "festival-preparation",
      slug: "festival-preparation",
      title: "Festival preparation",
      summary: "Community cleaning and decoration activities were completed with local participation.",
      content: "Community cleaning and decoration activities were completed with local participation.",
      category: "culture",
      publishLabel: "April 2026",
      status: "published",
      priority: "normal",
      pinned: false,
      language: "en"
    })
  ]);
})(typeof window === "undefined" ? globalThis : window);
