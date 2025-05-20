// Google Auth functionality for the game

// Variables to store user info
let user = {
  isLoggedIn: false,
  id: null,
  name: null,
  email: null,
  picture: null
};

// Make user globally accessible immediately
window.user = user;

// Initialize Google Sign-In
function initGoogleAuth() {
  try {
    // Google's OAuth Client ID (you need to create this in Google Cloud Console)
    // For production, replace with your actual client ID
    const CLIENT_ID = "981038010043-2ncl5vf9esngvj0dtmqidvo6dtj6dflr.apps.googleusercontent.com"; 
    
    // Track if Google authentication is actually available and properly configured
    let googleAuthAvailable = false;
      // Check if the Google API is available
    if (typeof google !== 'undefined' && google.accounts) {      try {
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false, // Don't automatically sign in
          cancel_on_tap_outside: true,
          // Error handler for initialization failures
          error_callback: (error) => {
            console.error("Google authentication error:", error);
            googleAuthAvailable = false;
              // Handle specific error for origin not allowed (403 errors)
            if (error.type === "popup_failed_to_open" || 
                error.error === "idpiframe_initialization_failed" ||
                (typeof error === 'string' && error.includes("origin")) ||
                (error.message && error.message.includes("403"))) {
              
              // Log detailed error for developers
              console.error(`Authentication Error: The current origin (${window.location.origin}) is not allowed for this Google Client ID.`);
              console.info("To fix this issue, add your origin to the authorized JavaScript origins in Google Cloud Console.");
              
              // Create a more descriptive button that clearly indicates it's for guest login
              customizeGoogleButton({
                message: `Origin not allowed: ${window.location.origin}`,
                type: "origin_error"
              });
              
              // Make guest login more prominent automatically
              const guestBtn = document.getElementById("guest-login-btn");
              if (guestBtn) {
                guestBtn.style.backgroundColor = "#4CAF50";
                guestBtn.style.color = "white";
                guestBtn.style.fontWeight = "bold";
                guestBtn.style.border = "2px solid #3e8e41";
                guestBtn.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
                guestBtn.style.transform = "scale(1.05)";
                guestBtn.innerHTML = "👋 Play as Guest (Recommended)";
                
                // Add a small hint that explains why guest is recommended
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
                  
                  // Add animation if it doesn't exist
                  if (!document.getElementById('auth-animations')) {
                    const style = document.createElement('style');
                    style.id = 'auth-animations';
                    style.textContent = `
                      @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 0.9; }
                      }
                    `;
                    document.head.appendChild(style);
                  }
                  
                  const loginOptions = document.getElementById("login-options");
                  if (loginOptions) {
                    loginOptions.appendChild(hintText);
                  }
                }
                
                // Add click handler to automatically dismiss after guest login
                guestBtn.addEventListener("click", function onceOnly() {
                  const hint = document.getElementById("auth-hint");
                  if (hint && hint.parentNode) {
                    hint.parentNode.removeChild(hint);
                  }
                  // Remove this listener after first click
                  guestBtn.removeEventListener("click", onceOnly);
                });
              }
            } else {
              // Handle other types of errors
              customizeGoogleButton({
                message: "Error: " + (error.message || error.type || "Unknown error"),
                type: "general_error"
              });
            }
          }
        });
        
        googleAuthAvailable = true;
        
        // Display the Sign In With Google button
        google.accounts.id.renderButton(
          document.getElementById("google-login-btn"),
          { 
            type: "standard",
            logo_alignment: "left",
            logo_type: "default",
            logo_color: "default",
            text: "signin_with",
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "pill",
            width: 240
          }
        );
        
        // Add event handler for button to show help message if authentication fails
        const googleBtn = document.getElementById("google-login-btn");
        if (googleBtn) {
          googleBtn.addEventListener("click", function(e) {
            // This will run if the Google button is clicked but authentication fails silently
            setTimeout(() => {
              // If user is still not logged in after a click, show helpful message
              if (!user.isLoggedIn) {
                console.log("Google authentication may not be properly configured");
              }
            }, 3000);
          });
        }
      } catch (googleError) {
        console.error("Error initializing Google Sign-In:", googleError);
        googleAuthAvailable = false;
        customizeGoogleButton("Error: " + googleError.message);
      }
    } else {
      // Handle case where Google API is not available
      googleAuthAvailable = false;
      customizeGoogleButton("Google API not available");
      console.warn("Google authentication API not available");
    }
  } catch (error) {
    console.error("Failed to initialize Google Auth:", error);
    customizeGoogleButton("Error: " + error.message);
  }
}

// Create a custom Google button when the API is not available
function customizeGoogleButton(options = {}) {
  try {
    // Handle string parameter for backward compatibility
    if (typeof options === 'string') {
      options = {
        message: options,
        type: 'general_error'
      };
    }
    
    // Set defaults
    const errorReason = options.message || "Google Sign-In is unavailable";
    const errorType = options.type || "general_error";
    
    const googleBtn = document.getElementById("google-login-btn");
    if (googleBtn) {
      // Clear the button and create a more obvious "unavailable" styling
      googleBtn.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
              alt="Google Logo" class="login-icon" style="opacity: 0.6; margin-right: 8px;">
          <span>Sign in with Google</span>
        </div>`;
      
      googleBtn.style.backgroundColor = "#f0f0f0";
      googleBtn.style.color = "#888";
      googleBtn.style.position = "relative";
      googleBtn.style.cursor = "not-allowed";
      googleBtn.style.border = "1px solid #ccc";
      
      // Add a warning indicator
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
      
      googleBtn.appendChild(warningIndicator);
      
      // Remove any existing click listeners
      const newBtn = googleBtn.cloneNode(true);
      googleBtn.parentNode.replaceChild(newBtn, googleBtn);
      
      // Add a click event that shows an error message and redirects to guest login
      newBtn.addEventListener("click", function() {
        // For origin errors, show a simpler message and go straight to guest login
        if (errorType === 'origin_error') {
          const message = `Google Sign-In isn't available because this origin (${window.location.origin}) isn't authorized in Google Cloud Console. Continuing as a guest instead.`;
          showGuestLoginMessage(message);
          return;
        }
        
        // For other errors, show the detailed modal
        // Create a modal dialog instead of an alert
        const modal = document.createElement('div');
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
        messageBox.style.backgroundColor = "white";
        messageBox.style.padding = "20px";
        messageBox.style.borderRadius = "10px";
        messageBox.style.maxWidth = "500px";
        messageBox.style.width = "80%";
        messageBox.style.maxHeight = "80vh";
        messageBox.style.overflow = "auto";
        
        messageBox.innerHTML = `
          <h3 style="color: #d32f2f; margin-top: 0;">Google Sign-In Unavailable</h3>
          <p><strong>Issue:</strong> ${errorReason}</p>
          <p><strong>Current origin:</strong> ${window.location.origin}</p>
          <h4>To make Google Sign-In work:</h4>
          <ol>
            <li>Create a project in Google Cloud Console</li>
            <li>Set up OAuth credentials</li>
            <li>Add your site's origin to the authorized JavaScript origins</li>
            <li>For local development, add both http://localhost and http://127.0.0.1 with your port number</li>
            <li>Update the CLIENT_ID in auth.js</li>
          </ol>
          <p>See GOOGLE_AUTH_SETUP.md for detailed instructions.</p>
          <div style="text-align: center; margin-top: 20px;">
            <button id="modal-continue-guest" style="background-color: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Continue as Guest</button>
            <button id="modal-close" style="background-color: #f0f0f0; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">Close</button>
          </div>
        `;
        
        modal.appendChild(messageBox);
        document.body.appendChild(modal);
        
        // Add event listeners to the buttons
        document.getElementById('modal-continue-guest').addEventListener('click', function() {
          document.body.removeChild(modal);
          // Auto-click the guest button
          const guestBtn = document.getElementById("guest-login-btn");
          if (guestBtn) {
            guestBtn.click();
          }
        });
        
        document.getElementById('modal-close').addEventListener('click', function() {
          document.body.removeChild(modal);
        });
        
        // Also log to console for developers
        console.info("Google auth setup guidance:", errorReason);
      });
    }
  } catch (error) {
    console.error("Error customizing Google button:", error);
  }
}

// Handle the response from Google Sign-In
function handleCredentialResponse(response) {
  try {
    if (!response || !response.credential) {
      console.error("Invalid Google authentication response");
      return;
    }
    
    // Parse the JWT token
    const responsePayload = parseJwt(response.credential);
    
    if (!responsePayload || !responsePayload.sub) {
      console.error("Failed to parse Google credential response");
      return;
    }    // Update user object with Google profile information
    user = {
      isLoggedIn: true,
      id: responsePayload.sub,
      name: responsePayload.name || "Google User",
      email: responsePayload.email,
      picture: responsePayload.picture,
      isGuest: false // Flag to identify non-guest users
    };
    
    // Log the full authentication response for debugging
    console.log("Google authentication successful - user profile:", {
      name: user.name,
      email: user.email ? user.email.substring(0, 5) + "..." : "none", // Partial for privacy
      id: user.id.substring(0, 8) + "...", // Truncated for privacy
      picture: user.picture ? "✓" : "✗"
    });
    
    // Update UI to show logged-in state
    updateLoginUI();
    
    // Save user to localStorage for session persistence
    saveUserToLocalStorage();
    
    // Enable auto-login for next time
    localStorage.setItem("beeGame_autoLogin", "true");
    
    // Make sure player name is synchronized everywhere
    if (window.gameState && typeof window.gameState.syncWithUserAccount === 'function') {
      console.log("Synchronizing game state with new Google user:", user.name);
      window.gameState.syncWithUserAccount();
    }
    
    // Use playerUnifier if available
    if (window.playerUnifier && typeof window.playerUnifier.updateAllNames === 'function') {
      console.log("Updating all player name instances via playerUnifier");
      window.playerUnifier.updateAllNames();
    }
    
    console.log("User logged in with Google:", user.name);
  } catch (error) {
    console.error("Error handling Google authentication response:", error);
    // Fallback to guest login in case of error
    document.getElementById("guest-login-btn").click();
  }
}

// Parse the JWT token from Google
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')
  );
  return JSON.parse(jsonPayload);
}

// Update UI based on login state
function updateLoginUI() {
  const loginOptions = document.getElementById("login-options");
  const userProfile = document.getElementById("user-profile");
  
  if (user.isLoggedIn) {
    // Hide login options
    loginOptions.style.display = "none";
    
    // Show user profile with data
    userProfile.style.display = "block";
    
    // Set the user avatar if available
    const userAvatar = document.getElementById("user-avatar");
    if (user.picture) {
      userAvatar.src = user.picture;
      userAvatar.style.display = "block";
      userAvatar.style.border = "2px solid #FFD700"; // Gold border for logged-in users
    } else {
      // For guest users, show a default bee avatar instead of hiding
      if (user.isGuest) {
        userAvatar.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cellipse cx='50' cy='50' rx='25' ry='18' fill='%23000000'/%3E%3Cellipse cx='50' cy='50' rx='22' ry='15' fill='%23FFD700'/%3E%3Crect x='30' y='40' width='40' height='5' fill='%23000000'/%3E%3Crect x='28' y='55' width='44' height='5' fill='%23000000'/%3E%3Cellipse cx='35' cy='35' rx='15' ry='8' fill='rgba(173,216,230,0.8)' transform='rotate(-30 35 35)'/%3E%3Cellipse cx='65' cy='35' rx='15' ry='8' fill='rgba(173,216,230,0.8)' transform='rotate(30 65 35)'/%3E%3Ccircle cx='40' cy='45' r='3' fill='%23000000'/%3E%3Ccircle cx='60' cy='45' r='3' fill='%23000000'/%3E%3C/svg%3E";
        userAvatar.style.display = "block";
        userAvatar.style.border = "2px solid #FFD700";
        userAvatar.style.borderRadius = "50%";
        userAvatar.style.backgroundColor = "#f8f8f8";
      } else {
        // Hide avatar if no picture available for non-guest users
        userAvatar.style.display = "none";
      }
    }
    
    // Set the user name
    document.getElementById("user-name").textContent = user.name;
    
    // Update home page player name if it exists
    const homePlayerName = document.getElementById("home-player-name");
    if (homePlayerName) {
      homePlayerName.textContent = user.name;
    }
    
    // Update player name in game UI if game has started
    if (typeof window.updatePlayerNames === 'function') {
      window.updatePlayerNames();
    } else if (typeof window.updateAllPlayerNames === 'function') {
      window.updateAllPlayerNames();
    }
  } else {
    // Show login options
    loginOptions.style.display = "flex";
    
    // Hide user profile
    userProfile.style.display = "none";
  }
}

// Save user to localStorage for session persistence
function saveUserToLocalStorage() {
  localStorage.setItem("beeGame_user", JSON.stringify(user));
}

// Load user from localStorage on page load
function loadUserFromLocalStorage() {
  const savedUser = localStorage.getItem("beeGame_user");
  if (savedUser) {
    user = JSON.parse(savedUser);
    updateLoginUI();
  }
}

// Log out the user
function logoutUser() {
  user = {
    isLoggedIn: false,
    id: null,
    name: null,
    email: null,
    picture: null
  };
  
  localStorage.removeItem("beeGame_user");
  updateLoginUI();
}

// Helper function to login as guest
function loginAsGuest() {
  console.log("Guest login triggered");
  
  // Check for saved guest name in localStorage
  const savedGuestName = localStorage.getItem('beeGame_guestName');
  
  // Generate a random bee name if none is saved
  let guestName = savedGuestName;
  if (!guestName || guestName.trim() === '') {
    // Use the generator if it exists
    if (window.guestNameHandler && typeof window.guestNameHandler.generateRandomBeeName === 'function') {
      guestName = window.guestNameHandler.generateRandomBeeName();
    } else {
      // Fallback to simple random names if generator isn't loaded yet
      const randomNames = ['Buzzy Bee', 'Honey Collector', 'Pollen Gatherer', 'Flower Explorer', 'Nectar Hunter'];
      guestName = randomNames[Math.floor(Math.random() * randomNames.length)];
    }
    
    // Save the random name for future sessions
    localStorage.setItem('beeGame_guestName', guestName);
  }
  
  // Create guest user data
  user = {
    isLoggedIn: true,
    id: "guest-" + Date.now(),
    name: guestName,
    email: null,
    picture: null, // No avatar for guest users
    isGuest: true  // Flag to identify guest users
  };
    // Update UI and save to localStorage
  updateLoginUI();
  saveUserToLocalStorage();
  
  // Make sure player name is synchronized everywhere
  if (window.gameState && typeof window.gameState.syncWithUserAccount === 'function') {
    console.log("Synchronizing game state with guest user:", guestName);
    window.gameState.syncWithUserAccount();
  }
  
  // Use playerUnifier if available for consistent naming across UI
  if (window.playerUnifier && typeof window.playerUnifier.updateAllNames === 'function') {
    console.log("Updating all player name instances via playerUnifier");
    window.playerUnifier.updateAllNames();
  }
  
  // Navigate directly to the game home page after a short delay
  setTimeout(function() {
    try {
      document.getElementById("login-page").style.display = "none";
      
      const homePage = document.getElementById("home-page");
      if (homePage) {
        homePage.style.display = "flex";
        
        // Call setupHomePage function if it exists
        if (typeof setupHomePage === 'function') {
          setupHomePage();
        }
        
        // Make guest name input field focused if it exists
        setTimeout(() => {
          const guestNameInput = document.getElementById("guest-name-input");
          if (guestNameInput) {
            guestNameInput.focus();
            guestNameInput.select(); // Select the text for easy editing
          }
        }, 500);
      } else {
        console.error("Home page element not found");
      }
    } catch (error) {
      console.error("Error transitioning to home page:", error);
    }
  }, 500);
}

// Setup event listeners for login page
function setupAuthEventListeners() {
  // Guest login button
  document.getElementById("guest-login-btn").addEventListener("click", loginAsGuest);
  
  // Logout button
  document.getElementById("logout-btn").addEventListener("click", function() {
    console.log("User logged out");
    logoutUser();
  });
  
  // Start game button (from user profile)
  const loginStartBtn = document.getElementById("login-start-btn");
  if (loginStartBtn) {
    loginStartBtn.addEventListener("click", function() {
      try {
        document.getElementById("login-page").style.display = "none";
        
        const homePage = document.getElementById("home-page");
        if (homePage) {
          homePage.style.display = "flex";
          
          // Call setupHomePage function if it exists
          if (typeof setupHomePage === 'function') {
            setupHomePage();
          }
        } else {
          console.error("Home page element not found");
        }
      } catch (error) {
        console.error("Error transitioning to home page:", error);
      }
    });
  }
}

// Check if user is already logged in on page load
function checkExistingLogin() {
  // Load saved user data
  loadUserFromLocalStorage();
  
  // If user is logged in, show their profile
  if (user.isLoggedIn) {
    console.log("User already logged in:", user.name);
    updateLoginUI();    // Auto-proceed to game after short delay if they were previously logged in
    if (localStorage.getItem("beeGame_autoLogin") === "true") {
      setTimeout(function() {
        try {
          document.getElementById("login-page").style.display = "none";
          
          const homePage = document.getElementById("home-page");
          if (homePage) {
            homePage.style.display = "flex";
            
            // Call setupHomePage function if it exists
            if (typeof setupHomePage === 'function') {
              setupHomePage();
            }
          } else {
            console.error("Home page element not found");
          }
        } catch (error) {
          console.error("Error auto-transitioning to home page:", error);
        }
      }, 1000);
    }
  }
}

// Initialize auth on page load
document.addEventListener("DOMContentLoaded", function() {
  console.log("Auth system initializing...");
  
  // Check for existing login
  checkExistingLogin();
  
  // Setup event listeners
  setupAuthEventListeners();
  
  // Initialize Google Sign-In with a slight delay to ensure DOM is ready
  setTimeout(function() {
    initGoogleAuth();
    
    // Add diagnostic info to console after initialization
    setTimeout(logAuthDiagnostics, 2000);
  }, 500);
});

// Helper function to log auth diagnostic information
function logAuthDiagnostics() {
  console.log("------------ Auth Diagnostics ------------");
  console.log("Current origin:", window.location.origin);
  console.log("Google API available:", typeof google !== 'undefined' && typeof google.accounts !== 'undefined');
  console.log("User logged in:", user.name, user.isLoggedIn);
  if (user.isLoggedIn) {
    console.log("Login type:", user.id?.startsWith("guest-") ? "Guest" : "Google");
    console.log("User ID:", user.id?.substring(0, 10) + "...");
  }
  
  // Check for common issues
  if (typeof google === 'undefined' || typeof google.accounts === 'undefined') {
    console.warn("Google API not loaded - check network connectivity and script inclusion");
  }
  
  if (window.location.protocol === "file:") {
    console.warn("Running from file:// protocol - Google auth requires http:// or https://");
  }
  
  console.log("-----------------------------------------");
}

// Helper function to show a brief guest login message and then trigger guest login
function showGuestLoginMessage(message) {
  // Show a brief toast-style message
  const toast = document.createElement('div');
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  toast.style.color = "white";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "5px";
  toast.style.zIndex = "1000";
  toast.style.maxWidth = "80%";
  toast.style.textAlign = "center";
  toast.style.fontSize = "14px";
  toast.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.25)";
  toast.style.animationName = "fadeInUp";
  toast.style.animationDuration = "0.4s";
  toast.style.animationFillMode = "both";
  toast.textContent = message;
  
  // Add animation keyframes if they don't exist
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translate(-50%, 20px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
      @keyframes fadeOutDown {
        from {
          opacity: 1;
          transform: translate(-50%, 0);
        }
        to {
          opacity: 0;
          transform: translate(-50%, 20px);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  // Auto-click the guest button after a short delay
  setTimeout(() => {
    // Fade out and remove the toast
    toast.style.animationName = "fadeOutDown";
    toast.style.animationDuration = "0.5s";
    
    // Auto-click the guest button
    const guestBtn = document.getElementById("guest-login-btn");
    if (guestBtn) {
      guestBtn.click();
    }
    
    // Remove the toast after animation
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 500);
  }, 2000);
  
  // Log guidance to console for developers
  console.info("Guest login triggered because: " + message);
}
