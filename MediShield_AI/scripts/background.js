// background.js - MediShield AI service worker

// Import Firebase libraries from local scripts (CSP-safe)
importScripts('firebase-app-compat.js');
importScripts('firebase-auth-compat.js');
importScripts('firebase-firestore-compat.js');

// Import Firebase configuration from a central location
// This helps avoid duplication of Firebase config across multiple files
importScripts('firebase-config.js'); // This will define the firebaseConfig variable

// Initialize Firebase if not already initialized
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle text scanning requests from content script
  if (message.action === 'scanText') {
    // Forward the request to the backend
    fetch('http://localhost:5001/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message.text, url: message.url })
    })
    .then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === 'invalid_api_key') {
          throw new Error(`API key not configured: ${errorData.message}`);
        } else if (errorData.error === 'network_error') {
          throw new Error(`Network error: ${errorData.detail}`);
        } else if (errorData.error === 'parse_error') {
          throw new Error(`Parse error: ${errorData.detail}`);
        } else {
          throw new Error(`HTTP error ${response.status}: ${errorData.detail || 'Unknown error'}`);
        }
      }
      return response.json();
    })
    .then(data => {
      sendResponse({ success: true, data });
    })
    .catch(error => {
      console.error('MediShield backend error:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
  
  // Handle backend status check requests from popup
  if (message.action === 'checkBackendStatus') {
    fetch('http://localhost:5001/scan', {
      method: 'HEAD',
      cache: 'no-store' // Don't use cached responses
    })
    .then(response => {
      if (response.ok) {
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: `HTTP error ${response.status}` });
      }
    })
    .catch(error => {
      console.error('MediShield backend status check error:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
  
  // Handle saving scan data to Firebase
  if (message.action === 'saveScanData') {
    // Initialize Firebase if not already initialized
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const user = firebase.auth().currentUser;
    if (user) {
      const db = firebase.firestore();
      const userId = user.uid;
      const websiteUrl = message.data.url;
      const claims = message.data.claims;

      db.collection('users').doc(userId).collection('history').doc(btoa(websiteUrl)).set({
        url: websiteUrl,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        claim_count: claims.length,
      })
      .then(() => {
        const batch = db.batch();
        claims.forEach((claim, index) => {
          const claimRef = db.collection('users').doc(userId).collection('history').doc(btoa(websiteUrl)).collection('claims').doc();
          batch.set(claimRef, claim);
        });
        return batch.commit();
      })
      .then(() => console.log('Scan data saved to Firestore'))
      .catch((error) => console.error('Error saving scan data to Firestore:', error));
    }
  }
});

// When a tab is updated, inject the content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    console.log(`🛡️ MediShield AI monitoring tab: ${tab.url}`);
  }
});

// Log when the service worker is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('🛡️ MediShield AI extension installed');
});