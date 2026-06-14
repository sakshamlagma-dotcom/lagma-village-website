# Firebase Notes Setup

Use this when visitor notes should be visible to everyone, not just one browser.

## 1. Create Firebase app

1. Open the Firebase console.
2. Create or open a project.
3. Add a Web app.
4. Copy the Firebase config values.
5. Paste them into `firebase-config.js`.

Example shape:

```js
window.LAGMA_FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 2. Enable Firestore

Create a Cloud Firestore database in production mode.

## 3. Add Firestore rules

These rules let visitors read notes and create new notes. They do not allow edits or deletes from the website.

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /visitorNotes/{noteId} {
      allow read: if true;
      allow create: if
        request.resource.data.keys().hasOnly(['title', 'message', 'name', 'page', 'createdAt']) &&
        request.resource.data.title is string &&
        request.resource.data.title.size() > 0 &&
        request.resource.data.title.size() <= 70 &&
        request.resource.data.message is string &&
        request.resource.data.message.size() > 0 &&
        request.resource.data.message.size() <= 300 &&
        request.resource.data.name is string &&
        request.resource.data.name.size() <= 40 &&
        request.resource.data.page == 'notification' &&
        request.resource.data.createdAt == request.time;
      allow update, delete: if false;
    }
  }
}
```

## 4. Publish

After `firebase-config.js` is filled, push it to GitHub. The notice page will switch from local notes to cloud notes automatically.
