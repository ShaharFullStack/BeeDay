# Setting Up Google Authentication for Bee Day Game

This document provides detailed instructions for setting up Google Authentication for the Bee Day game.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Your application running on a web server (not from file://)

## Step-by-Step Instructions

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top of the page
3. Click "NEW PROJECT"
4. Enter a project name (e.g., "Bee Day Game") and click "CREATE"
5. Wait for the project to be created and then select it

### 2. Configure the OAuth Consent Screen

1. In the left sidebar, navigate to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type and click "CREATE"
3. Fill in the required information:
   - App name: "Bee Day Game"
   - User support email: Your email address
   - Developer contact information: Your email address
4. Click "SAVE AND CONTINUE"
5. Skip adding scopes and click "SAVE AND CONTINUE"
6. Add any test users if needed and click "SAVE AND CONTINUE"
7. Review your app registration summary and click "BACK TO DASHBOARD"

### 3. Create OAuth Client ID

1. In the left sidebar, navigate to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" at the top of the page and select "OAuth client ID"
3. Select "Web application" as the application type
4. Give your client a name (e.g., "Bee Day Web Client")
5. Under "Authorized JavaScript origins", add the origins where your app will run:
   - For local development: 
     - `http://localhost` (without port)
     - `http://localhost:5500` (with port number)
     - `http://127.0.0.1` (without port)
     - `http://127.0.0.1:5500` (with port number)
   - For production: Add your production domain (e.g., `https://yourdomain.com`)
6. Click "CREATE"
7. A popup will appear with your Client ID and Client Secret. Note down the Client ID.

### 4. Update Your Application Code

1. Open `js/auth.js` in your code editor
2. Locate the `CLIENT_ID` constant near the top of the file
3. Replace the existing value with your new Client ID:

```javascript
const CLIENT_ID = "YOUR_NEW_CLIENT_ID_HERE";
```

4. Save the file

### 5. Testing

1. Make sure your application is running on a server matching one of the authorized origins
2. Try to sign in with Google
3. If issues persist, check the browser console for error messages

## Troubleshooting

### Common Issues

1. **"The given origin is not allowed for the given client ID"**
   - Ensure the domain/origin you're running the app from exactly matches what you added to authorized origins
   - Remember that `http://localhost` and `http://127.0.0.1` are different origins
   - Check for port mismatches (e.g., running on port 5501 instead of 5500)

2. **"Invalid client ID"**
   - Double-check you copied the full client ID correctly
   - Make sure there are no extra spaces or characters

3. **"Google is not defined"**
   - Check if the Google API script is loading properly
   - Verify your internet connection
   - Look for console errors related to loading scripts

## Further Resources

- [Google Identity - Sign in with Google for Web](https://developers.google.com/identity/gsi/web/guides/overview)
- [OAuth 2.0 for Client-side Web Applications](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
