// Firebase Auth v9.6.1
// This is a compatibility wrapper to allow using Firebase Auth with older module formats

// Firebase Auth is loaded via script tag in popup.html

// Export the auth functionality globally for compatibility with v8 SDK
window.firebase = window.firebase || {};
window.firebase.auth = () => {
  const auth = getAuth();
  return {
    currentUser: auth.currentUser,
    signInWithPopup: (provider) => signInWithPopup(auth, provider),
    signOut: () => signOut(auth),
    onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback)
  };
};

// Export GoogleAuthProvider
window.firebase.auth.GoogleAuthProvider = GoogleAuthProvider;