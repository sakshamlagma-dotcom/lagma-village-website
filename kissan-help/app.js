const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const linkSearch = document.querySelector("#linkSearch");
const linkCards = Array.from(document.querySelectorAll(".link-card"));
const stateLinks = Array.from(document.querySelectorAll(".state-list a"));

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

linkSearch.addEventListener("input", () => {
  const query = linkSearch.value.trim().toLowerCase();

  linkCards.forEach((card) => {
    const haystack = `${card.textContent} ${card.dataset.keywords || ""}`.toLowerCase();
    card.classList.toggle("is-hidden", query.length > 0 && !haystack.includes(query));
  });

stateLinks.forEach((link) => {
    const haystack = link.textContent.toLowerCase();
    link.classList.toggle("is-hidden", query.length > 0 && !haystack.includes(query));
  });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("../sw.js"));
}
