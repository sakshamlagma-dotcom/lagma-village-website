const form = document.querySelector("#photo-upload-form");
const fileInput = document.querySelector("#photo-file");
const dropZone = document.querySelector("#drop-zone");
const previewCard = document.querySelector("#preview-card");
const previewImage = document.querySelector("#image-preview");
const removePhotoButton = document.querySelector("#remove-photo");
const progressWrap = document.querySelector("#progress-wrap");
const progressBar = document.querySelector("#progress-bar");
const progressText = document.querySelector("#progress-text");
const uploadStatus = document.querySelector("#upload-status");
const uploadButton = document.querySelector(".upload-button");

let previewUrl = "";
let progressTimer = null;

function setStatus(message, type = "") {
  uploadStatus.textContent = message;
  uploadStatus.classList.toggle("is-success", type === "success");
  uploadStatus.classList.toggle("is-error", type === "error");
}

function clearPreview() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = "";
  fileInput.value = "";
  previewImage.src = "";
  previewCard.hidden = true;
}

function showPreview(file) {
  clearPreview();
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setStatus("Please choose an image file.", "error");
    return;
  }

  previewUrl = URL.createObjectURL(file);
  previewImage.src = previewUrl;
  previewImage.alt = file.name;
  previewCard.hidden = false;
  setStatus("");
}

function startProgress() {
  let progress = 0;
  progressWrap.hidden = false;
  progressBar.style.width = "0%";
  progressText.textContent = "Preparing upload...";

  progressTimer = window.setInterval(() => {
    progress = Math.min(progress + 14, 92);
    progressBar.style.width = `${progress}%`;
    progressText.textContent = progress < 60 ? "Optimizing preview..." : "Saving gallery details...";
  }, 180);
}

function finishProgress() {
  window.clearInterval(progressTimer);
  progressBar.style.width = "100%";
  progressText.textContent = "Upload ready for review.";
}

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
  setStatus("Photo removed. Choose another image when ready.");
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!fileInput.files?.[0]) {
    setStatus("Please choose a photo before upload.", "error");
    return;
  }

  uploadButton.disabled = true;
  setStatus("");
  startProgress();

  // This demo keeps uploads local for now. Connect Cloudinary/Firebase here later.
  window.setTimeout(() => {
    finishProgress();
    uploadButton.disabled = false;
    form.reset();
    clearPreview();
    setStatus("Photo details prepared successfully. Connect storage to publish it live.", "success");
  }, 1600);
});
