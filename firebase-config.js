window.LAGMA_SITE_OPTIONS = {
  analyticsMeasurementId: "G-PZQ45J2B8G",
  enableFirebase: true
};

window.LAGMA_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAUkYG6pWWUMLYPKwRq62hjsogHN-1JmqA",
  authDomain: "lagma-village-notes.firebaseapp.com",
  projectId: "lagma-village-notes",
  storageBucket: "lagma-village-notes.firebasestorage.app",
  messagingSenderId: "7909835731",
  appId: "1:7909835731:web:8fb01cd3611c4f70f5e526"
};

window.LAGMA_FIREBASE_OPTIONS = {
  enabled: window.LAGMA_SITE_OPTIONS.enableFirebase === true,
  notesCollection: "visitorNotes",
  pendingNotesCollection: "pendingVisitorNotes",
  requireNoteApproval: true,
  likesCollection: "websiteStats",
  likesDocument: "likes",
  initialLikeCount: 761
};
