// Firebase App (the core Firebase SDK) v9.6.1
// This is a compatibility wrapper to allow using Firebase SDK with older module formats

// Firebase is loaded via script tag in popup.html

// Firebase configuration is imported from firebase-config.js
// The firebaseConfig variable is available globally

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the app globally for compatibility with v8 SDK
window.firebase = window.firebase || {};
window.firebase.INTERNAL = window.firebase.INTERNAL || {};
window.firebase.apps = window.firebase.apps || [];
window.firebase.initializeApp = (config) => {
  if (window.firebase.apps.length === 0) {
    window.firebase.app = initializeApp(config);
    window.firebase.apps.push(window.firebase.app);
    return window.firebase.app;
  }
  return window.firebase.app;
};