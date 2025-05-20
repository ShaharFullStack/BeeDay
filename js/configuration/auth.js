// Google Auth functionality for the game

// Variables to store user info
let user = {
  isLoggedIn: false,
  id: null,
  name: null,
  email: null,
  picture: null,
  isGuest: false // Initialize isGuest
};
// Make user globally accessible and point to the current 'user' object
// This initial assignment is important. Subsequent reassignments of the 'user'
// variable below will also need to update window.user.
window.user = user; 

// Initialize Google Sign-In
function initGoogleAuth() {
  try {
    // Google's OAuth Client ID (you need to create this in Google Cloud Console)
    const CLIENT_ID = "981038010043-2ncl5vf9esngvj0dtmqidvo6dtj6dflr.apps.googleusercontent.com"; 
    
    let googleAuthAvailable = false;
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) { // Ensure google.accounts.id exists
      try {
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false, 
          cancel_on_tap_outside: true,
          error_callback: (error) => {
            console.error("Google authentication initialization error:", error);
            googleAuthAvailable = false;
            if (error.type === "popup_failed_to_open" || 
                error.error === "idpiframe_initialization_failed" ||
                (typeof error.message === 'string' && error.message.includes("origin")) || // Check error.message as well
                (error.details && typeof error.details === 'string' && error.details.includes("origin")) || // Google sometimes puts it in details
                (error.message && error.message.includes("403"))) {
              
              console.error(`Authentication Error: The current origin (${window.location.origin}) is not allowed for this Google Client ID.`);
              console.info("To fix this issue, add your origin to the authorized JavaScript origins in Google Cloud Console.");
              
              customizeGoogleButton({
                message: `Origin not allowed: ${window.location.origin}`,
                type: "origin_error"
              });
              
              const guestBtn = document.getElementById("guest-login-btn");
              if (guestBtn) {
                guestBtn.style.backgroundColor = "#4CAF50";
                guestBtn.style.color = "white";
                guestBtn.style.fontWeight = "bold";
                guestBtn.style.border = "2px solid #3e8e41";
                guestBtn.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
                guestBtn.style.transform = "scale(1.05)";
                guestBtn.innerHTML = "👋 Play as Guest (Recommended)";
                
                const existingHint = document.getElementById("auth-hint");
                if (existingHint) {
                  existingHint.textContent = "Google login unavailable on this origin - guest mode works everywhere!";
                  existingHint.style.color = "#ff9800";
                } else {
                  const hintText = document.createElement('div');
                  hintText.id = "auth-hint";
                  hintText.textContent = "Google login unavailable on this origin - guest mode works everywhere!";
                  hintText.style.fontSize = "12px";
                  hintText.style.opacity = "0.9";
                  hintText.style.marginTop = "5px";
                  hintText.style.color = "#ff9800";
                  hintText.style.textAlign = "center";
                  hintText.style.padding = "3px 8px";
                  hintText.style.borderRadius = "10px";
                  hintText.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
                  hintText.style.animation = "fadeIn 0.5s ease-in";
                  
                  if (!document.getElementById('auth-animations')) {
                    const style = document.createElement('style');
                    style.id = 'auth-animations';
                    style.textContent = `@keyframes fadeIn { from { opacity: 0; } to { opacity: 0.9; } }`;
                    document.head.appendChild(style);
                  }
                  
                  const loginOptions = document.getElementById("login-options");
                  if (loginOptions) {
                    loginOptions.appendChild(hintText);
                  }
                }
                
                guestBtn.addEventListener("click", function onceOnly() {
                  const hint = document.getElementById("auth-hint");
                  if (hint && hint.parentNode) {
                    hint.parentNode.removeChild(hint);
                  }
                  guestBtn.removeEventListener("click", onceOnly);
                }, { once: true }); // Use {once: true} for cleaner event removal
              }
            } else {
              customizeGoogleButton({
                message: "Error: " + (error.message || error.type || "Unknown Google Auth error"),
                type: "general_error"
              });
            }
          }
        });
        
        googleAuthAvailable = true;
        
        const googleLoginBtnContainer = document.getElementById("google-login-btn");
        if (googleLoginBtnContainer) {
            google.accounts.id.renderButton(
              googleLoginBtnContainer,
              { 
                type: "standard",
                logo_alignment: "left",
                text: "signin_with", 
                theme: "outline",     
                size: "large",
                shape: "pill",
                width: 240 
              }
            );
        } else {
            console.error("Google login button container 'google-login-btn' not found.");
            customizeGoogleButton("Button container missing"); // Inform user
        }
        
        const googleBtnRendered = document.querySelector("#google-login-btn > div"); // Google usually renders a div inside
        if (googleBtnRendered) {
          googleBtnRendered.addEventListener("click", function() {
            setTimeout(() => {
              if (!user.isLoggedIn) {
                console.log("Google authentication may not be properly configured. If popups are blocked, please enable them for this site.");
              }
            }, 3000);
          });
        }
      } catch (googleError) {
        console.error("Error initializing Google Sign-In client library:", googleError);
        googleAuthAvailable = false;
        customizeGoogleButton("Error: " + googleError.message);
      }
    } else {
      googleAuthAvailable = false;
      customizeGoogleButton("Google API not available");
      console.warn("Google authentication API (google.accounts.id) not available. Ensure the Google API script is loaded correctly before this script.");
    }
  } catch (error) {
    console.error("Failed to initialize Google Auth (outer try-catch):", error);
    customizeGoogleButton("Error: " + error.message);
  }
}

function customizeGoogleButton(options = {}) {
  try {
    if (typeof options === 'string') {
      options = { message: options, type: 'general_error' };
    }
    
    const errorReason = options.message || "Google Sign-In is unavailable";
    const errorType = options.type || "general_error";
    
    const googleBtnContainer = document.getElementById("google-login-btn"); 
    if (googleBtnContainer) {
        googleBtnContainer.innerHTML = ''; // Clear previous content (e.g., Google's own button)

        const customBtn = document.createElement('div'); 
        customBtn.style.display = 'inline-flex'; 
        customBtn.style.alignItems = 'center';
        customBtn.style.justifyContent = 'center';
        customBtn.style.backgroundColor = "#f0f0f0";
        customBtn.style.color = "#888";
        customBtn.style.border = "1px solid #ccc";
        customBtn.style.borderRadius = "20px"; 
        customBtn.style.padding = "0px 12px"; // Adjusted padding for height
        customBtn.style.fontSize = "14px"; 
        customBtn.style.fontFamily = "Roboto, arial, sans-serif"; 
        customBtn.style.cursor = "not-allowed";
        customBtn.style.width = "240px"; 
        customBtn.style.height = "40px"; 
        customBtn.style.boxSizing = "border-box";
        customBtn.style.position = "relative"; 

        customBtn.innerHTML = `
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
               alt="Google Logo" class="login-icon" style="opacity: 0.6; margin-right: 12px; width: 18px; height: 18px;">
          <span>Sign in with Google</span>
        `;
        
        googleBtnContainer.appendChild(customBtn);

        const warningIndicator = document.createElement('div');
        warningIndicator.style.position = "absolute";
        warningIndicator.style.right = "10px";
        warningIndicator.style.top = "50%";
        warningIndicator.style.transform = "translateY(-50%)";
        warningIndicator.style.backgroundColor = "#FFCC00";
        warningIndicator.style.color = "#000";
        warningIndicator.style.borderRadius = "50%";
        warningIndicator.style.width = "20px";
        warningIndicator.style.height = "20px";
        warningIndicator.style.display = "flex";
        warningIndicator.style.alignItems = "center";
        warningIndicator.style.justifyContent = "center";
        warningIndicator.style.fontSize = "14px";
        warningIndicator.style.fontWeight = "bold";
        warningIndicator.textContent = "!";
        customBtn.appendChild(warningIndicator);
        
        customBtn.addEventListener("click", function() {
          if (errorType === 'origin_error') {
            const message = `Google Sign-In isn't available for this site (${window.location.origin}). Continuing as guest.`;
            showGuestLoginMessage(message); 
            return;
          }
          
          const modal = document.createElement('div');
          // ... (modal styling as before) ...
          modal.style.position = "fixed";
          modal.style.top = "0";
          modal.style.left = "0";
          modal.style.width = "100%";
          modal.style.height = "100%";
          modal.style.backgroundColor = "rgba(0,0,0,0.7)";
          modal.style.zIndex = "1000";
          modal.style.display = "flex";
          modal.style.justifyContent = "center";
          modal.style.alignItems = "center";
          
          const messageBox = document.createElement('div');
          // ... (messageBox styling as before) ...
          messageBox.style.backgroundColor = "white";
          messageBox.style.padding = "20px";
          messageBox.style.borderRadius = "10px";
          messageBox.style.maxWidth = "500px";
          messageBox.style.width = "90%"; // Use percentage for better responsiveness
          messageBox.style.maxHeight = "80vh";
          messageBox.style.overflowY = "auto";
          
          messageBox.innerHTML = `
            <h3 style="color: #d32f2f; margin-top: 0; font-size: 1.2em;">Google Sign-In Unavailable</h3>
            <p style="font-size: 0.9em;"><strong>Issue:</strong> ${errorReason}</p>
            <p style="font-size: 0.9em;"><strong>Current origin:</strong> ${window.location.origin}</p>
            <h4 style="font-size: 1em;">To enable Google Sign-In:</h4>
            <ol style="font-size: 0.9em; padding-left: 20px;">
              <li>Go to Google Cloud Console.</li>
              <li>Navigate to "APIs & Services" > "Credentials".</li>
              <li>Find your OAuth 2.0 Client ID for Web applications.</li>
              <li>Under "Authorized JavaScript origins", add: <strong>${window.location.origin}</strong></li>
              <li>For local development, also add origins like http://localhost:&lt;port&gt; if used.</li>
              <li>Ensure the CLIENT_ID in the auth.js script matches.</li>
            </ol>
            <p style="font-size: 0.9em;">Consult Google's documentation for detailed setup instructions.</p>
            <div style="text-align: center; margin-top: 20px;">
              <button id="modal-continue-guest" style="background-color: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; margin-right: 10px; font-size: 0.9em;">Continue as Guest</button>
              <button id="modal-close" style="background-color: #f0f0f0; border: 1px solid #ddd; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 0.9em;">Close</button>
            </div>
          `;
          
          modal.appendChild(messageBox);
          document.body.appendChild(modal);
          
          document.getElementById('modal-continue-guest').addEventListener('click', function() {
            if (modal.parentNode) document.body.removeChild(modal);
            const guestBtnElement = document.getElementById("guest-login-btn");
            if (guestBtnElement) guestBtnElement.click();
          });
          
          document.getElementById('modal-close').addEventListener('click', function() {
            if (modal.parentNode) document.body.removeChild(modal);
          });
          
          console.info("Google auth setup guidance shown due to:", errorReason);
        });
    }
  } catch (error) {
    console.error("Error in customizeGoogleButton:", error);
  }
}

function handleCredentialResponse(response) {
  try {
    if (!response || !response.credential) {
      console.error("Invalid Google authentication response. Credential missing.");
      return;
    }
    
    const responsePayload = parseJwt(response.credential);
    
    if (!responsePayload || !responsePayload.sub) {
      console.error("Failed to parse Google credential response or 'sub' field missing.");
      return;
    }   
    // REASSIGNMENT of user object
    user = {
      isLoggedIn: true,
      id: responsePayload.sub,
      name: responsePayload.name || "Google User",
      email: responsePayload.email,
      picture: responsePayload.picture,
      isGuest: false 
    };
    window.user = user; // UPDATE window.user reference

    console.log("Google authentication successful - user profile:", {
      name: user.name,
      email: user.email ? user.email.substring(0, 5) + "..." : "none", 
      id: user.id ? user.id.substring(0, 8) + "..." : "unknown", 
      picture: user.picture ? "✓" : "✗"
    });
    
    updateLoginUI();
    saveUserToLocalStorage();
    localStorage.setItem("beeGame_autoLogin", "true");   
    
    if (window.gameState && typeof window.gameState.syncWithUserAccount === 'function') {
      console.log("Synchronizing game state with new Google user:", user.name);
      window.gameState.syncWithUserAccount();
      
      if (window.gameState.currentUser && window.gameState.currentUser.name !== user.name) {
        console.log("Directly updating gameState.currentUser with auth user details");
        window.gameState.currentUser.name = user.name;
        window.gameState.currentUser.id = user.id;
        window.gameState.currentUser.isGuest = false;
      }
    } else if (window.gameState) {
      console.log("Creating/Updating gameState.currentUser directly (no sync method available)");
      window.gameState.currentUser = { id: user.id, name: user.name, isGuest: false };
    }
    
    setTimeout(() => {
      if (window.playerUnifier && typeof window.playerUnifier.updateAllNames === 'function') {
        console.log("Updating all player name instances via playerUnifier (with delay) after Google login.");
        window.playerUnifier.updateAllNames();
      }
    }, 200);
    
    console.log("User logged in with Google:", user.name);
  } catch (error) {
    console.error("Error handling Google authentication response:", error);
    const guestBtn = document.getElementById("guest-login-btn");
    if (guestBtn) {
        console.log("Attempting fallback to guest login due to error in Google response handling.");
        guestBtn.click();
    } else {
        console.error("Guest login button not found for fallback.");
    }
  }
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
        throw new Error("Invalid JWT structure: Missing payload part.");
    }
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error parsing JWT:", e);
    return null; 
  }
}

function updateLoginUI() {
  const loginOptions = document.getElementById("login-options");
  const userProfile = document.getElementById("user-profile");
  
  if (!loginOptions || !userProfile) {
    console.warn("Login UI elements ('login-options' or 'user-profile') not found. Cannot update UI.");
    return;
  }

  if (user.isLoggedIn) {
    loginOptions.style.display = "none";
    userProfile.style.display = "block"; 
    
    const userAvatar = document.getElementById("user-avatar");
    if (userAvatar) {
        if (user.picture) {
          userAvatar.src = user.picture;
          userAvatar.style.display = "block";
          userAvatar.style.border = "2px solid #FFD700"; 
          userAvatar.style.borderRadius = "50%"; 
          userAvatar.style.backgroundColor = "transparent"; 
        } else {
          if (user.isGuest) {
            userAvatar.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cellipse cx='50' cy='50' rx='25' ry='18' fill='%23000000'/%3E%3Cellipse cx='50' cy='50' rx='22' ry='15' fill='%23FFD700'/%3E%3Crect x='30' y='40' width='40' height='5' fill='%23000000'/%3E%3Crect x='28' y='55' width='44' height='5' fill='%23000000'/%3E%3Cellipse cx='35' cy='35' rx='15' ry='8' fill='rgba(173,216,230,0.8)' transform='rotate(-30 35 35)'/%3E%3Cellipse cx='65' cy='35' rx='15' ry='8' fill='rgba(173,216,230,0.8)' transform='rotate(30 65 35)'/%3E%3Ccircle cx='40' cy='45' r='3' fill='%23000000'/%3E%3Ccircle cx='60' cy='45' r='3' fill='%23000000'/%3E%3C/svg%3E";
            userAvatar.style.display = "block";
            userAvatar.style.border = "2px solid #FFD700"; 
            userAvatar.style.borderRadius = "50%";
            userAvatar.style.backgroundColor = "#f8f8f8"; 
          } else {
            userAvatar.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%23cccccc'/%3E%3Ctext x='50' y='65' font-size='30' text-anchor='middle' fill='%23ffffff' font-family='Arial, sans-serif'%3EGU%3C/text%3E%3C/svg%3E"; // Generic User
            userAvatar.style.display = "block";
            userAvatar.style.border = "2px solid #ccc";
            userAvatar.style.borderRadius = "50%";
            userAvatar.style.backgroundColor = "#e0e0e0";
          }
        }
    }
    
    const userNameEl = document.getElementById("user-name");
    if (userNameEl) {
        userNameEl.textContent = user.name || "User";
    }
    
    const homePlayerName = document.getElementById("home-player-name");
    if (homePlayerName) {
      homePlayerName.textContent = user.name || "Player";
    }
    
    if (typeof window.updatePlayerNames === 'function') {
      window.updatePlayerNames();
    } else if (typeof window.updateAllPlayerNames === 'function') {
      window.updateAllPlayerNames();
    }
  } else {
    loginOptions.style.display = "flex"; 
    userProfile.style.display = "none";
  }
}

function saveUserToLocalStorage() {
  try {
    localStorage.setItem("beeGame_user", JSON.stringify(user));
  } catch (e) {
    console.error("Error saving user to localStorage:", e);
  }
}

function loadUserFromLocalStorage() {
  try {
    const savedUser = localStorage.getItem("beeGame_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser && typeof parsedUser.isLoggedIn === 'boolean') {
        user = parsedUser; // REASSIGNMENT
        window.user = user; // UPDATE window.user reference
        if (typeof user.isGuest === 'undefined') {
            user.isGuest = !!(user.id && user.id.startsWith("guest-")); // Ensure boolean
        }
      } else {
        console.warn("Invalid user data found in localStorage. Clearing.");
        localStorage.removeItem("beeGame_user");
        user = { isLoggedIn: false, id: null, name: null, email: null, picture: null, isGuest: false }; // REASSIGNMENT
        window.user = user; // UPDATE window.user reference
      }
    } else {
      // No user in localStorage, ensure 'user' is the initial default state.
      // This is generally handled by the initial declaration, but explicit reset can be safer if unsure.
      // user = { isLoggedIn: false, id: null, name: null, email: null, picture: null, isGuest: false };
      // window.user = user;
    }
  } catch (e) {
    console.error("Error loading user from localStorage:", e);
    localStorage.removeItem("beeGame_user");
    user = { isLoggedIn: false, id: null, name: null, email: null, picture: null, isGuest: false }; // REASSIGNMENT
    window.user = user; // UPDATE window.user reference
  }
  updateLoginUI(); 
}

function logoutUser() {
  const previousUserName = user.name; 
  // REASSIGNMENT of user object
  user = {
    isLoggedIn: false,
    id: null,
    name: null,
    email: null,
    picture: null,
    isGuest: false 
  };
  window.user = user; // UPDATE window.user reference

  localStorage.removeItem("beeGame_autoLogin");
  localStorage.removeItem("beeGame_user");
  // localStorage.removeItem("beeGame_guestName"); // Consider if guest name should be cleared on full logout.
                                                 // If a user logs out of Google and then wants to be a new guest,
                                                 // keeping it might be confusing, or convenient if they often use the same guest name.
                                                 // For now, let's keep guestName persistent unless explicitly changed.
  updateLoginUI();
  console.log("User logged out:", previousUserName || "No user was logged in");

  const loginPage = document.getElementById("login-page");
  const homePage = document.getElementById("home-page"); 

  if (loginPage) loginPage.style.display = "flex"; 
  if (homePage) homePage.style.display = "none";

  // Re-render Google button if it was customized due to an error,
  // so user can try signing in with Google again.
  // Check if Google API is available before trying to re-initialize
  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      const googleBtnContainer = document.getElementById("google-login-btn");
      if (googleBtnContainer && !googleBtnContainer.querySelector("iframe")) { // If no iframe, it was likely customized
          console.log("Re-initializing Google button after logout.");
          initGoogleAuth(); // This will attempt to render the button again.
      }
  }
}

function loginAsGuest() {
  if (user.isLoggedIn) {
    console.log("User was logged in as:", user.name, "(Guest:", user.isGuest, "). Switching to a new Guest session.");
    logoutUser(); 
    // After logoutUser(), 'user' and 'window.user' are reset to a logged-out state.
  } else {
    console.log("No active session. Preparing for Guest login.");
    localStorage.removeItem("beeGame_autoLogin"); 
    localStorage.removeItem("beeGame_user");
    // REASSIGNMENT of user object
    user = {
      isLoggedIn: false,
      id: null,
      name: null,
      email: null,
      picture: null,
      isGuest: false 
    };
    window.user = user; // UPDATE window.user reference
  }

  console.log("Setting up new Guest session...");

  const guestId = "guest-" + Date.now(); 
  const savedGuestName = localStorage.getItem('beeGame_guestName');
  
  let guestName = savedGuestName;
  if (!guestName || guestName.trim() === '') {
    if (window.guestNameHandler && typeof window.guestNameHandler.generateRandomBeeName === 'function') {
      guestName = window.guestNameHandler.generateRandomBeeName();
    } else {
      const randomNames = ['Buzzy Bee', 'Honey Hive', 'Pollen Pal', 'Flower Friend', 'Nectar Nomad'];
      guestName = randomNames[Math.floor(Math.random() * randomNames.length)];
    }
    localStorage.setItem('beeGame_guestName', guestName);
  }
  
  // Modify properties of the current 'user' object (which window.user also points to)
  user.isLoggedIn = true;
  user.id = guestId;
  user.name = guestName;
  user.email = null;
  user.picture = null; 
  user.isGuest = true;   
  
  updateLoginUI();
  saveUserToLocalStorage(); 
  
  if (window.gameState && typeof window.gameState.syncWithUserAccount === 'function') {
    console.log("Synchronizing game state with new guest user:", guestName);
    window.gameState.syncWithUserAccount();
  } else if (window.gameState) {
      console.log("Creating/Updating gameState.currentUser directly for guest (no sync method available)");
      window.gameState.currentUser = { id: user.id, name: user.name, isGuest: true };
  }
  
  if (window.playerUnifier && typeof window.playerUnifier.updateAllNames === 'function') {
    console.log("Updating all player name instances via playerUnifier for new guest.");
    window.playerUnifier.updateAllNames();
  }
  
  setTimeout(function() {
    try {
      const loginPage = document.getElementById("login-page");
      if (loginPage) loginPage.style.display = "none";
      
      const homePage = document.getElementById("home-page");
      if (homePage) {
        homePage.style.display = "flex"; 
        
        if (typeof setupHomePage === 'function') {
          setupHomePage();
        }
        
        setTimeout(() => {
          const guestNameInput = document.getElementById("guest-name-input");
          if (guestNameInput) {
            guestNameInput.focus();
            guestNameInput.select();
          }
        }, 100); // Shorter delay for focus
      } else {
        console.error("Home page element not found for guest login navigation.");
      }
    } catch (error) {
      console.error("Error transitioning to home page after guest login:", error);
    }
  }, 100); // Reduced delay for quicker transition
}

function setupAuthEventListeners() {
  const guestLoginBtn = document.getElementById("guest-login-btn");
  if (guestLoginBtn) {
    guestLoginBtn.addEventListener("click", loginAsGuest);
  } else {
    console.warn("Guest login button ('guest-login-btn') not found.");
  }
  
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logoutUser);
  } else {
    console.warn("Logout button ('logout-btn') not found.");
  }
  
  const loginStartBtn = document.getElementById("login-start-btn");
  if (loginStartBtn) {
    loginStartBtn.addEventListener("click", function() {
      try {
        const loginPage = document.getElementById("login-page");
        if (loginPage) loginPage.style.display = "none";
        
        const homePage = document.getElementById("home-page");
        if (homePage) {
          homePage.style.display = "flex"; 
          if (typeof setupHomePage === 'function') {
            setupHomePage();
          }
        } else {
          console.error("Home page element ('home-page') not found for start button navigation.");
        }
      } catch (error) {
        console.error("Error transitioning to home page from login start button:", error);
      }
    });
  } else {
    console.warn("Login start button ('login-start-btn') not found.");
  }
}

function checkExistingLogin() {
  loadUserFromLocalStorage(); 
  
  if (user.isLoggedIn) {
    console.log("User already logged in:", user.name, "(Guest:", user.isGuest, ")");
    // Auto-proceed only if beeGame_autoLogin is true (typically for Google users)
    // or if it's a guest user (guests usually want to jump back in).
    if (localStorage.getItem("beeGame_autoLogin") === "true" || user.isGuest) { 
      console.log("Auto-proceeding to home page...");
      setTimeout(function() {
        try {
          const loginPage = document.getElementById("login-page");
          if (loginPage) loginPage.style.display = "none";
          
          const homePage = document.getElementById("home-page");
          if (homePage) {
            homePage.style.display = "flex"; 
            if (typeof setupHomePage === 'function') {
              setupHomePage();
            }
          } else {
            console.error("Home page element not found for auto-transition.");
          }
        } catch (error) {
          console.error("Error auto-transitioning to home page:", error);
        }
      }, user.isGuest ? 200 : 500); 
    }
  } else {
    console.log("No existing user session found or user is not logged in.");
    updateLoginUI(); // Ensure login options are visible
  }
}

document.addEventListener("DOMContentLoaded", function() {
  console.log("Auth system initializing...");
  
  checkExistingLogin();
  setupAuthEventListeners();
  
  setTimeout(function() {
    // Only initialize Google Auth if not already logged in as Google
    // or if the Google button might need to be re-rendered (e.g. after error).
    // If user is a guest, Google button should still be available.
    if (!user.isLoggedIn || user.isGuest) {
        initGoogleAuth(); 
    } else if (user.isLoggedIn && !user.isGuest) {
        // If logged in with Google, ensure UI is correct but don't re-init unless necessary
        console.log("User already logged in with Google. Google Auth init skipped unless button needs re-render.");
        // Check if google button container is empty (might happen if page was reloaded weirdly)
        const googleBtnContainer = document.getElementById("google-login-btn");
        if (googleBtnContainer && googleBtnContainer.innerHTML.trim() === '') {
            initGoogleAuth();
        }
    }
    
    setTimeout(logAuthDiagnostics, 1500); // Shorter delay for diagnostics
  }, 300); // Shorter delay for init
});

function logAuthDiagnostics() {
  console.log("%c------------ Auth Diagnostics ------------", "color: blue; font-weight: bold;");
  console.log("Current origin:", window.location.origin);
  console.log("Google API object available:", typeof google !== 'undefined');
  console.log("Google Accounts API available:", typeof google !== 'undefined' && typeof google.accounts !== 'undefined' && typeof google.accounts.id !== 'undefined');
  
  // Create a deep copy of user for logging to avoid issues with ongoing modifications
  const userLogCopy = user ? JSON.parse(JSON.stringify(user)) : null;
  console.log("User object state:", userLogCopy);

  if (userLogCopy && userLogCopy.isLoggedIn) {
    console.log("Login type:", userLogCopy.isGuest ? "Guest" : "Google");
    console.log("User ID (partial):", userLogCopy.id ? userLogCopy.id.substring(0, 10) + "..." : "N/A");
  } else {
    console.log("User is not logged in.");
  }
  
  if (typeof google === 'undefined' || typeof google.accounts === 'undefined' || typeof google.accounts.id === 'undefined') {
    console.warn("Google API (google.accounts.id) not fully loaded. Google Sign-In button might not work.");
  }
  
  if (window.location.protocol === "file:") {
    console.warn("Running from file:// protocol - Google Auth requires http:// or https://.");
  }

  const googleBtnContainer = document.getElementById("google-login-btn");
  if (googleBtnContainer) {
    if (googleBtnContainer.querySelector('iframe')) {
        console.log("Google Sign-In button (iframe) is rendered.");
    } else if (googleBtnContainer.textContent.includes("Sign in with Google")) {
        console.log("Customized/fallback Google button is rendered.");
    } else if (googleBtnContainer.innerHTML.trim() === ''){
        console.warn("Google Sign-In button container is empty. Button may not have rendered.");
    } else {
        console.log("Google button container HTML (first 100 chars):", googleBtnContainer.innerHTML.substring(0,100) + "...");
    }
  } else {
    console.error("Google button container ('google-login-btn') NOT FOUND in the DOM.");
  }
  console.log("%c-----------------------------------------", "color: blue; font-weight: bold;");
}

function showGuestLoginMessage(message) {
  const existingToast = document.querySelector(".auth-toast-message");
  if (existingToast) existingToast.remove(); // Remove any previous toast

  const toast = document.createElement('div');
  toast.className = "auth-toast-message"; // Add a class for easier selection
  // ... (toast styling as before) ...
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.backgroundColor = "rgba(0, 0, 0, 0.85)"; 
  toast.style.color = "white";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "8px"; 
  toast.style.zIndex = "2000"; 
  toast.style.maxWidth = "calc(100% - 40px)"; 
  toast.style.textAlign = "center";
  toast.style.fontSize = "14px";
  toast.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)"; 
  toast.style.animationName = "fadeInUpToast"; 
  toast.style.animationDuration = "0.4s";
  toast.style.animationFillMode = "both";
  toast.textContent = message;
  
  if (!document.getElementById('toast-custom-animations')) { 
    const style = document.createElement('style');
    style.id = 'toast-custom-animations';
    style.textContent = `
      @keyframes fadeInUpToast { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      @keyframes fadeOutDownToast { from { opacity: 1; transform: translate(-50%, 0); } to { opacity: 0; transform: translate(-50%, 20px); } }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animationName = "fadeOutDownToast";
    
    const guestBtn = document.getElementById("guest-login-btn");
    if (guestBtn) {
      guestBtn.click(); 
    }
    
    setTimeout(() => {
      if (toast.parentNode) { 
        toast.parentNode.removeChild(toast);
      }
    }, 500); // Duration of fadeOutDownToast
  }, 2500); 
  
  console.info("Guest login automatically triggered because: " + message);
}
