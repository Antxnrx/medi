# How to Reload the MedShield AI Extension

After making changes to the extension files, you need to reload the extension in Chrome for the changes to take effect. Follow these steps:

1. Open Chrome and navigate to `chrome://extensions/`
2. Find the MedShield AI extension in the list
3. Click the refresh/reload icon on the extension card
4. Alternatively, toggle the extension off and then on again

After reloading, the extension should connect to the backend server that's already running on port 5001 (the default port configured in the backend).

## Troubleshooting

If you're still seeing "Backend status: Not available" after reloading:

1. Make sure the backend server is running (you should see "✅ MedShield backend (Gemini) running on port 5001" in the terminal)
2. Try closing and reopening the extension popup
3. Check if you can access the backend directly by opening http://localhost:5001/scan in your browser
4. If all else fails, restart Chrome and then start the extension again

The changes we've made to the code should improve the connection reliability between the extension and the backend server.