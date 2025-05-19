// Main entry point for the application

// Function to hide controls after 15 seconds
function hideControlsAfterDelay() {
  setTimeout(() => {
    const controlsInfo = document.getElementById("controls-info");
    if (controlsInfo) {
      // Fade out the controls smoothly
      controlsInfo.style.opacity = "1";
      
      const fadeOut = () => {
        if (parseFloat(controlsInfo.style.opacity) > 0) {
          controlsInfo.style.opacity = parseFloat(controlsInfo.style.opacity) - 0.05;
          setTimeout(fadeOut, 50);
        } else {
          controlsInfo.style.display = "none";
        }
      };
      
      fadeOut();
    }
  }, 15000); // 15 seconds
}

// Display error message
function showError(message) {
  console.error(message);
  const errorMsg = document.getElementById("error-message");
  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsg.style.display = "block";
    
    // Auto-hide error after 8 seconds
    setTimeout(() => {
      errorMsg.style.display = "none";
    }, 8000);
  }
}

// Function to handle the homepage to game transition
function initializeHomepage() {
  try {
    console.log("Initializing homepage...");
    
    const startButton = document.getElementById("start-game-btn");
    const homePage = document.getElementById("home-page");
    const gameContainer = document.getElementById("game-container");
    
    // Check if elements exist before proceeding
    if (!startButton) {
      throw new Error("Start button element not found");
    }
    
    if (!homePage) {
      throw new Error("Home page element not found");
    }
    
    if (!gameContainer) {
      throw new Error("Game container element not found");
    }
    
    // Detect device type first thing
    if (typeof detectMobile === 'function') {
      detectMobile();
    } else {
      console.warn("detectMobile function not found, using basic detection");
      window.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    console.log("Device detected as:", window.isMobile ? "Mobile" : "Desktop");
    
    // Add click event listener to start button
    startButton.addEventListener("click", () => {
      console.log("Start button clicked");
      
      try {
        // Hide homepage and ensure game container is visible
        homePage.style.display = "none";
        gameContainer.style.display = "block";
        
        // Ensure DOM is updated before proceeding
        setTimeout(() => {
          try {
            // Verify game container elements after delay
            console.log("Checking UI elements before starting game...");
            const uiElements = checkUiElements();
            console.log("UI element check result:", uiElements);            // Start the game with delay to ensure DOM is ready
            if (typeof window.startGame === 'function') {
              // Check if THREE is available first
              if (typeof THREE !== 'undefined') {
                console.log("THREE is already available, starting game directly");
                window.startGame();
                console.log("Game started successfully via direct call");
              }
              // Use the threeLoader to ensure THREE is available before starting
              else if (window.threeLoader && typeof window.threeLoader.waitForThree === 'function') {
                console.log("Waiting for THREE to be available via threeLoader...");
                window.threeLoader.waitForThree(() => {
                  console.log("THREE is available via threeLoader, starting game...");
                  window.startGame();
                  console.log("Game started successfully via threeLoader");
                });
              } else {
                console.log("Direct start (threeLoader not found or THREE already available)");
                window.startGame();
              }
            } else {
              throw new Error("startGame function is not defined");
            }
            
            // Set up the timer to hide controls
            hideControlsAfterDelay();
          } catch (delayedError) {
            console.error("Error during delayed game start:", delayedError);
            showError("Game initialization error: " + delayedError.message);
          }
        }, 100); // Small delay to ensure DOM updates
        
      } catch (error) {
        console.error("Error starting game:", error);
        showError("Game start error: " + error.message);
      }
    });
    
    console.log("Homepage initialized successfully");
    
  } catch (error) {
    console.error("Error in homepage initialization:", error);
    showError("Homepage initialization error: " + error.message);
  }
}

// Function to check if all required UI elements exist
function checkUiElements() {
  const elements = {
    nectarCarried: !!document.getElementById("nectar-carried"),
    nectarCapacity: !!document.getElementById("nectar-capacity"),
    honeyInHive: !!document.getElementById("honey-in-hive"),
    controlsInfo: !!document.getElementById("controls-info"),
    messageBox: !!document.getElementById("message-box"),
    errorMessage: !!document.getElementById("error-message"),
    pointerLockInfo: !!document.getElementById("pointer-lock-info")
  };
  
  // Add mobile-specific elements if on mobile
  if (window.isMobile) {
    elements.joystickLeft = !!document.getElementById("joystick-left");
    elements.joystickRight = !!document.getElementById("joystick-right");
    elements.mobileHeightControls = !!document.getElementById("mobile-height-controls");
    elements.mobileButtons = !!document.getElementById("mobile-buttons");
    elements.tiltNotification = !!document.getElementById("tilt-notification");
  }
  
  return elements;
}

// Set up global error handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Unhandled error:", error, "at", source, "line", lineno);
  showError("Error: " + message);
  return true; // Prevents the default browser error handling
};

// Start the homepage when the page is loaded
window.onload = function() {
  console.log("Window loaded");
  
  try {
    // Check if the DOM is ready
    if (document.readyState === "complete") {
      console.log("DOM is ready, initializing homepage");
      initializeHomepage();
    } else {
      console.log("DOM not ready, waiting for DOMContentLoaded");
      // Wait for DOM to be fully loaded
      document.addEventListener("DOMContentLoaded", function() {
        console.log("DOMContentLoaded fired, initializing homepage");
        initializeHomepage();
      });
    }
    
    // Debug info
    console.log("Browser info:", navigator.userAgent);
    console.log("Screen dimensions:", window.innerWidth, "x", window.innerHeight);
    console.log("Pixel ratio:", window.devicePixelRatio);
    
  } catch (error) {
    console.error("Critical error in window.onload:", error);
    alert("Critical error loading game: " + error.message);
  }
};