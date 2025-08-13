// MedShield AI Popup Script

// Firebase configuration is loaded from the script tag in popup.html
// No need to redefine it here

// Initialize Firebase (if not already initialized)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

document.addEventListener('DOMContentLoaded', function() {
  const statusDiv = document.getElementById('status');
  const outputDiv = document.getElementById('output');
  const scanButton = document.getElementById('scanButton');
  const loginButton = document.getElementById('loginButton');
  const historyButton = document.getElementById('historyButton');
  
  // Initially hide history button
  if (historyButton) historyButton.style.display = 'none';

  // Check backend status when popup opens
  checkBackendStatus();

  // Add click event listener to scan button
  scanButton.addEventListener('click', function() {
    // Get the current active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs[0]) {
        const activeTab = tabs[0];
        
        // Send message to content script to trigger scan
        chrome.tabs.sendMessage(activeTab.id, {action: 'triggerScan'}, function(response) {
          if (chrome.runtime.lastError) {
            outputDiv.innerHTML = '<div class="status error">Error: Could not communicate with content script.</div>';
          } else if (response && response.success) {
            outputDiv.innerHTML = '<div class="status active">Scan initiated successfully!</div>';
          } else {
            outputDiv.innerHTML = '<div class="status error">Error: ' + (response?.error || 'Unknown error') + '</div>';
          }
        });
      } else {
        outputDiv.innerHTML = '<div class="status error">Error: No active tab found.</div>';
      }
    });
  });

  // Function to check backend status
  function checkBackendStatus() {
    chrome.runtime.sendMessage({action: 'checkBackendStatus'}, function(response) {
      if (chrome.runtime.lastError) {
        statusDiv.className = 'status error';
        statusDiv.textContent = 'Backend status: Error communicating with background script';
        return;
      }
      
      if (response && response.success) {
        statusDiv.className = 'status active';
        statusDiv.textContent = 'Backend status: Running';
      } else {
        // Try direct fetch as a fallback
        fetch('http://localhost:5001/scan', {
          method: 'HEAD',
          mode: 'no-cors' // This helps with CORS issues
        })
        .then(() => {
          statusDiv.className = 'status active';
          statusDiv.textContent = 'Backend status: Running';
        })
        .catch(error => {
          statusDiv.className = 'status error';
          statusDiv.textContent = 'Backend status: Not available. Backend server is not responding';
        });
      }
    });
  }
  
  // Add click event listener for login/logout button
  if (loginButton) {
    loginButton.addEventListener('click', function() {
      if (firebase.auth().currentUser) {
        // User is logged in, so log out
        firebase.auth().signOut().then(() => {
          console.log("User logged out.");
        }).catch((error) => {
          console.error("Logout failed:", error);
        });
      } else {
        // User is not logged in, so start the sign-in process
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
          .then((result) => {
            console.log("User logged in:", result.user);
          }).catch((error) => {
            console.error("Login failed:", error);
          });
      }
    });
  }

  // Add event listener for history button
  if (historyButton) {
    historyButton.addEventListener('click', function() {
      displayHistory();
    });
  }

  // Listen for authentication state changes
  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        if (loginButton) {
          loginButton.style.display = 'none';
          loginButton.textContent = 'Logout'; // Although hidden, good for state
        }
        if (historyButton) {
          historyButton.style.display = 'block';
        }
        // Optionally display history automatically on login
        // displayHistory();
      } else {
        // User is signed out.
        if (loginButton) {
          loginButton.style.display = 'block';
          loginButton.textContent = 'Login/Signup';
        }
        if (historyButton) {
          historyButton.style.display = 'none';
        }
        // Clear output when logged out
        outputDiv.innerHTML = '';
      }
    });
  }

  // Function to display user history
  async function displayHistory() {
    const user = firebase.auth().currentUser;
    if (!user) {
      outputDiv.innerHTML = '<div class="status error">Please log in to view history.</div>';
      return;
    }

    outputDiv.innerHTML = '<div class="status active">Fetching history...</div>';

    try {
      // Fetch history data from Firestore
      const historyRef = firebase.firestore().collection('users').doc(user.uid).collection('history');
      const snapshot = await historyRef.orderBy('timestamp', 'desc').get();

      let historyHtml = '<h3>Scanned Websites History</h3>';

      if (snapshot.empty) {
        historyHtml += '<p>No scanned history found.</p>';
      } else {
        snapshot.forEach(doc => {
          const websiteData = doc.data();
          const url = doc.id; // Using URL as document ID
          const claimCount = websiteData.claim_count || 0;
          historyHtml += `<div class="history-item"><strong>${url}</strong> (${claimCount} claims found)</div>`;
        });
      }

      outputDiv.innerHTML = historyHtml;

      // Add click listeners to history items
      const historyItems = document.querySelectorAll('.history-item');
      historyItems.forEach(item => {
        item.style.cursor = 'pointer'; // Indicate clickable
        item.addEventListener('click', function() {
          const url = item.querySelector('strong').textContent;
          displayClaims(url);
        });
      });

    } catch (error) {
      console.error("Error fetching history:", error);
      outputDiv.innerHTML = '<div class="status error">Error fetching history.</div>';
    }
  }

  // Function to display claims for a specific website
  async function displayClaims(url) {
    const user = firebase.auth().currentUser;
    if (!user) {
      outputDiv.innerHTML = '<div class="status error">Please log in to view history.</div>';
      return;
    }

    outputDiv.innerHTML = '<div class="status active">Fetching claims...</div>';

    try {
      const claimsRef = firebase.firestore().collection('users').doc(user.uid).collection('history').doc(url).collection('claims');
      const snapshot = await claimsRef.get();

      let claimsHtml = '<button id="backButton" class="status active">Back to History</button>';
      claimsHtml += `<h3>Claims for ${url}</h3>`;

      if (snapshot.empty) {
        claimsHtml += '<p>No claims found for this website.</p>';
      } else {
        snapshot.forEach(doc => {
          const claimData = doc.data();
          claimsHtml += `
            <div class="claim-item">
              <h4>Claim: ${claimData.claim || '—'}</h4>
              <p><strong>Verdict:</strong> ${claimData.verdict || 'Unclear'}</p>
              <p><strong>Explanation:</strong> ${claimData.explanation || 'No explanation provided.'}</p>
              ${claimData.source ? `<p><strong>Source:</strong> <a href="${claimData.source}" target="_blank">${claimData.source}</a></p>` : ''}
            </div>
          `;
        });
      }

      outputDiv.innerHTML = claimsHtml;

      // Add back button functionality
      document.getElementById('backButton').addEventListener('click', function() {
        displayHistory();
      });

    } catch (error) {
      console.error("Error fetching claims:", error);
      outputDiv.innerHTML = '<div class="status error">Error fetching claims.</div>';
    }
  }
});