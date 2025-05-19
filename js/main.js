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

// Function to handle the homepage to game transition
function initializeHomepage() {
  try {
    const startButton = document.getElementById("start-game-btn");
    const homePage = document.getElementById("home-page");
    const gameContainer = document.getElementById("game-container");
    
    // Detect device type first thing
    detectMobile();
    
    if (startButton) {
      startButton.addEventListener("click", () => {
        // Hide homepage and show game
        if (homePage) homePage.style.display = "none";
        if (gameContainer) gameContainer.style.display = "block";
        
        // Start the game
        startGame();
        
        // Set up the timer to hide controls
        hideControlsAfterDelay();
      });
    } else {
      console.error("Start button not found");
    }
    
    // Set error handler for unhandled exceptions
    window.onerror = function(message, source, lineno, colno, error) {
      console.error("Unhandled error:", error);
      const errorMsg = document.getElementById("error-message");
      if (errorMsg) {
        errorMsg.textContent = "Error: " + message;
        errorMsg.style.display = "block";
      }
      return true; // Prevents the default browser error handling
    };
  } catch (error) {
    console.error("Error in homepage initialization:", error);
    const errorMsg = document.getElementById("error-message");
    if (errorMsg) {
      errorMsg.textContent = "Homepage error: " + error.message;
      errorMsg.style.display = "block";
    }
  }
}

// Start the homepage when the page is loaded
window.onload = function() {
  try {
    initializeHomepage();
    
    // Debug info for mobile
    if (isMobile) {
      console.log("Mobile device detected:", navigator.userAgent);
      console.log("Screen dimensions:", window.innerWidth, "x", window.innerHeight);
      console.log("Pixel ratio:", window.devicePixelRatio);
    }
  } catch (error) {
    console.error("Error in window.onload:", error);
    const errorMsg = document.getElementById("error-message");
    if (errorMsg) {
      errorMsg.textContent = "Page load error: " + error.message;
      errorMsg.style.display = "block";
    }
  }
};