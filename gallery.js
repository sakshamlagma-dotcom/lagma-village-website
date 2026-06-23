const baseGalleryPhotos = [
  { title: "Old Photo 1", category: "Old Memories", image: "1.jpeg", description: "Lagma ka purana gallery photo." },
  { title: "Old Photo 2", category: "Old Memories", image: "2.jpeg", description: "Purane samay ki Lagma memory." },
  { title: "Old Photo 3", category: "Old Memories", image: "3.jpeg", description: "Village archive se ek photo." },
  { title: "Old Photo 4", category: "Old Memories", image: "4.jpeg", description: "Lagma ke purane photo collection ka hissa." },
  { title: "Old Photo 5", category: "Village Life", image: "5.webp", description: "Gaon ki roj ki zindagi ka photo." },
  { title: "Old Photo 6", category: "Village Life", image: "6.webp", description: "Lagma village life memory." },
  { title: "Old Photo 7", category: "Village Life", image: "7.webp", description: "Purane gallery se village scene." },
  { title: "Old Photo 8", category: "Village Life", image: "8.webp", description: "Lagma ka ek aur saved photo." },
  { title: "Old Photo 9", category: "Culture & Festival", image: "9.webp", description: "Culture aur village moments se juda photo." },
  { title: "Old Photo 10", category: "Culture & Festival", image: "10.webp", description: "Lagma ke festival aur gathering ki memory." },
  { title: "Old Photo 11", category: "Old Memories", image: "11.jpeg", description: "Purana photo dobara gallery me add kiya gaya." },
  { title: "Old Photo 12", category: "Old Memories", image: "12.webp", description: "Lagma gallery ka old memory photo." },
  { title: "Village View A", category: "Village Life", image: "a.webp", description: "Lagma ka village view." },
  { title: "Village View B", category: "Village Life", image: "b.webp", description: "Gaon ki ek aur khoobsurat jhalak." },
  { title: "Village View C", category: "Village Life", image: "c.webp", description: "Lagma photo collection ka village frame." },
  { title: "Temple", category: "Culture & Festival", image: "temple.webp", description: "Lagma ke mandir aur parampara se juda photo." },
  { title: "School", category: "School & Education", image: "school-service.webp", description: "Lagma school aur education memory." },
  { title: "Farming", category: "Farming & Nature", image: "agriculture-service.webp", description: "Kheti aur prakriti se juda photo." },
  { title: "Pond", category: "Farming & Nature", image: "pond-service.webp", description: "Pokhar aur village nature memory." },
  { title: "Panchayat Work", category: "Development Work", image: "panchayat-service.webp", description: "Gaon ke development work ka photo." },
  { title: "Achievement", category: "People of Lagma", image: "achievement.webp", description: "Lagma ke logon ki proud memory." }
];

const categories = [
  "All",
  "Village Life",
  "Culture & Festival",
  "School & Education",
  "Farming & Nature",
  "Old Memories",
  "Development Work",
  "People of Lagma"
];

const uploadedStorageKey = "lagma-gallery-uploaded-photos";
const cloudinaryCloudName = "dx7k5hkgl";
const cloudinaryUploadPreset = "lagma_gallery_upload";
const cloudinaryGalleryTag = "lagma-village-gallery";

const state = {
  activeCategory: "All",
  searchText: "",
  visiblePhotos: [],
  activeIndex: 0,
  previewUrl: "",
  cloudPhotos: []
};

const grid = document.querySelector("#gallery-grid");
const filters = document.querySelector("#gallery-filters");
const searchInput = document.querySelector("#gallery-search");
const visibleCount = document.querySelector("#visible-count");
const emptyState = document.querySelector("#gallery-empty");
const lightbox = document.querySelector("#gallery-lightbox");
const lightboxImage = lightbox?.querySelector("img");
const lightboxCategory = document.querySelector("#lightbox-category");
const lightboxTitle = document.querySelector("#lightbox-title");
const lightboxDescription = document.querySelector("#lightbox-description");
const uploadForm = document.querySelector("#gallery-upload-form");
const fileInput = document.querySelector("#gallery-photo-input");
const dropZone = document.querySelector("#inline-drop-zone");
const preview = document.querySelector("#gallery-upload-preview");
const previewImage = preview?.querySelector("img");
const removePhotoButton = document.querySelector("#remove-gallery-photo");
const uploadStatus = document.querySelector("#gallery-upload-status");
const progress = document.querySelector("#inline-progress");
const progressBar = progress?.querySelector("span");

function getUploadedPhotos() {
  try {
    return JSON.parse(localStorage.getItem(uploadedStorageKey) || "[]");
  } catch (error) {
    return [];
  }
}

function saveUploadedPhoto(photo) {
  const uploaded = getUploadedPhotos();
  uploaded.unshift(photo);
  localStorage.setItem(uploadedStorageKey, JSON.stringify(uploaded.slice(0, 60)));
}

function getAllPhotos() {
  return [...state.cloudPhotos, ...getUploadedPhotos(), ...baseGalleryPhotos];
}

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function matchesSearch(photo) {
  const search = normalizeText(state.searchText);
  if (!search) return true;
  return [photo.title, photo.category, photo.description].some((value) => normalizeText(value).includes(search));
}

function getFilteredPhotos() {
  return getAllPhotos().filter((photo) => {
    const categoryMatch = state.activeCategory === "All" || photo.category === state.activeCategory;
    return categoryMatch && matchesSearch(photo);
  });
}

function setUploadStatus(message, type = "") {
  if (!uploadStatus) return;
  uploadStatus.textContent = message;
  uploadStatus.classList.toggle("is-success", type === "success");
  uploadStatus.classList.toggle("is-error", type === "error");
}

function renderFilters() {
  filters.innerHTML = categories.map((category) => `
    <button class="filter-button${category === state.activeCategory ? " is-active" : ""}" type="button" data-category="${category}">
      ${category}
    </button>
  `).join("");
}

function renderGallery() {
  state.visiblePhotos = getFilteredPhotos();
  visibleCount.textContent = String(state.visiblePhotos.length);
  emptyState.hidden = state.visiblePhotos.length > 0;

  grid.innerHTML = state.visiblePhotos.map((photo, index) => `
    <article class="gallery-card" style="animation-delay:${index * 25}ms" data-index="${index}" tabindex="0">
      <div class="card-image">
        <img src="${photo.image}" alt="Lagma gallery photo" loading="lazy">
      </div>
    </article>
  `).join("");
}

function getCloudinaryPhotoUrl(resource) {
  const version = resource.version ? `v${resource.version}/` : "";
  return `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/${version}${resource.public_id}.${resource.format}`;
}

async function loadCloudinaryUploads() {
  try {
    const response = await fetch(`https://res.cloudinary.com/${cloudinaryCloudName}/image/list/${cloudinaryGalleryTag}.json`);
    if (!response.ok) return;

    const data = await response.json();
    const resources = Array.isArray(data.resources) ? data.resources : [];
    state.cloudPhotos = resources
      .filter((resource) => {
        const tags = Array.isArray(resource.tags) ? resource.tags : [];
        const isHealthCheck = tags.includes("health-check") || resource.context?.custom?.name === "Health Check";
        return resource.public_id && resource.format && !isHealthCheck && resource.width > 20 && resource.height > 20;
      })
      .slice()
      .reverse()
      .map((resource, index) => {
        const uploader = resource.context?.custom?.name || resource.context?.name || "";
        return {
          title: uploader ? `Uploaded by ${uploader}` : `Uploaded Photo ${index + 1}`,
          category: "People of Lagma",
          image: getCloudinaryPhotoUrl(resource),
          description: "Lagma website par visitor dwara upload kiya gaya photo."
        };
      });
    renderGallery();
  } catch (error) {
    // Gallery should still work with local photos when Cloudinary is unavailable.
  }
}

function clearPreview() {
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  state.previewUrl = "";
  if (fileInput) fileInput.value = "";
  if (previewImage) previewImage.src = "";
  if (preview) preview.hidden = true;
}

function showPreview(file) {
  clearPreview();
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setUploadStatus("Sirf image file upload karein.", "error");
    return;
  }

  state.previewUrl = URL.createObjectURL(file);
  previewImage.src = state.previewUrl;
  previewImage.alt = file.name;
  preview.hidden = false;
  setUploadStatus("");
}

function startProgress() {
  if (!progress || !progressBar) return;
  progress.hidden = false;
  progressBar.style.width = "10%";
  window.setTimeout(() => {
    progressBar.style.width = "100%";
  }, 80);
}

function stopProgress() {
  window.setTimeout(() => {
    if (!progress || !progressBar) return;
    progress.hidden = true;
    progressBar.style.width = "0%";
  }, 500);
}

function openLightbox(index) {
  const photo = state.visiblePhotos[index];
  if (!photo || !lightbox) return;

  state.activeIndex = index;
  lightboxImage.src = photo.image;
  lightboxImage.alt = photo.title;
  lightboxCategory.textContent = photo.category;
  lightboxTitle.textContent = photo.title;
  lightboxDescription.textContent = photo.description;
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.hidden = true;
  document.body.style.overflow = "";
}

function showAdjacentPhoto(direction) {
  if (!state.visiblePhotos.length) return;
  const nextIndex = (state.activeIndex + direction + state.visiblePhotos.length) % state.visiblePhotos.length;
  openLightbox(nextIndex);
}

filters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.activeCategory = button.dataset.category;
  renderFilters();
  renderGallery();
});

searchInput?.addEventListener("input", (event) => {
  state.searchText = event.target.value;
  renderGallery();
});

dropZone?.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

dropZone?.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

dropZone?.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  const file = event.dataTransfer.files?.[0];
  if (!file) return;
  fileInput.files = event.dataTransfer.files;
  showPreview(file);
});

fileInput?.addEventListener("change", () => {
  showPreview(fileInput.files?.[0]);
});

removePhotoButton?.addEventListener("click", () => {
  clearPreview();
  setUploadStatus("Photo remove ho gaya.");
});

uploadForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const file = fileInput.files?.[0];
  const title = document.querySelector("#photo-title")?.value.trim();
  const category = document.querySelector("#photo-category")?.value;
  const description = document.querySelector("#photo-description")?.value.trim();

  if (!file || !title || !category || !description) {
    setUploadStatus("Photo, title, category aur description sab bharna zaroori hai.", "error");
    return;
  }

  startProgress();
  setUploadStatus("Photo upload ho raha hai...");

  const cloudinaryData = new FormData();
  cloudinaryData.append("file", file);
  cloudinaryData.append("upload_preset", cloudinaryUploadPreset);
  cloudinaryData.append("tags", `${cloudinaryGalleryTag},website-upload`);
  cloudinaryData.append("context", [
    `name=${title}`,
    `category=${category}`,
    `description=${description}`,
    "source=Lagma Village website gallery"
  ].join("|"));

  fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
    method: "POST",
    body: cloudinaryData
  })
    .then(async (response) => {
      if (!response.ok) {
        let message = "Cloud upload failed";
        try {
          const result = await response.json();
          message = result?.error?.message || message;
        } catch (error) {
          // Keep default message when Cloudinary response is not JSON.
        }
        throw new Error(message);
      }
      return response.json();
    })
    .then((result) => {
      const photo = {
        title,
        category,
        description,
        image: result.secure_url
      };
      state.cloudPhotos.unshift(photo);
      saveUploadedPhoto(photo);
      uploadForm.reset();
      clearPreview();
      renderGallery();
      setUploadStatus("Photo upload ho gaya aur gallery me add ho gaya.", "success");
    })
    .catch((error) => {
      setUploadStatus(`Upload nahi ho paya: ${error.message}`, "error");
    })
    .finally(stopProgress);
});

grid?.addEventListener("click", (event) => {
  const card = event.target.closest(".gallery-card");
  if (!card) return;
  openLightbox(Number(card.dataset.index));
});

grid?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const card = event.target.closest(".gallery-card");
  if (!card) return;
  openLightbox(Number(card.dataset.index));
});

document.querySelector(".lightbox-close")?.addEventListener("click", closeLightbox);
document.querySelector(".lightbox-prev")?.addEventListener("click", () => showAdjacentPhoto(-1));
document.querySelector(".lightbox-next")?.addEventListener("click", () => showAdjacentPhoto(1));

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (lightbox?.hidden) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") showAdjacentPhoto(-1);
  if (event.key === "ArrowRight") showAdjacentPhoto(1);
});

document.querySelector(".menu-toggle")?.addEventListener("click", (event) => {
  const nav = document.querySelector(".gallery-nav");
  const isOpen = nav.classList.toggle("is-open");
  event.currentTarget.setAttribute("aria-expanded", String(isOpen));
});

renderFilters();
renderGallery();
loadCloudinaryUploads();
