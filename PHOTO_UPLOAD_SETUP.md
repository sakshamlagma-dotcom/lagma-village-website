# Lagma Gallery Photo Upload Setup

The gallery upload form is already added in `gallery.html`.

Because this website is static, uploaded photos need an external storage service. The easiest setup for GitHub Pages is Cloudinary unsigned upload.

## Cloudinary setup

1. Create or open a Cloudinary account.
2. Go to **Settings > Upload > Upload presets**.
3. Create an **Unsigned** upload preset.
4. Set a folder such as `lagma-gallery-submissions`.
5. Copy your **Cloud name** and the **Upload preset** name.
6. Open `gallery.html` and update this form:

```html
<form
  class="gallery-upload-panel"
  id="gallery-upload-form"
  data-upload-endpoint=""
  data-cloudinary-cloud="YOUR_CLOUD_NAME"
  data-cloudinary-upload-preset="YOUR_UNSIGNED_UPLOAD_PRESET"
>
```

After this, visitors can upload photos from the website. New photos will appear in Cloudinary with the tags `lagma-village-gallery` and `website-upload`.

## Review before adding to gallery

Uploaded photos are intentionally not added to the public gallery automatically. Review them in Cloudinary first, download approved photos, rename them as the next gallery number such as `13.jpeg`, and add them to the website folder.
