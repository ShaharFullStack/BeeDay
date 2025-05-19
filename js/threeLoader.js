// This module is responsible for initializing THREE and other dependencies
// and ensuring they're available for all other modules

// Create a global threeLoader object
window.threeLoader = {};

// Flag to track whether THREE has been loaded
let threeLoaded = false;

// Function to check if THREE is loaded and available
function checkThreeAvailability() {
  if (typeof THREE !== 'undefined') {
    console.log("THREE is defined:", THREE);
    return true;
  }
  console.log("THREE is still undefined");
  return false;
}

// Function to wait until THREE is available
function waitForThree(callback, maxAttempts = 50) {
  console.log("waitForThree called with callback:", typeof callback);
  
  // Immediate check first
  if (checkThreeAvailability()) {
    console.log("THREE already available on initial check");
    threeLoaded = true;
    callback();
    return;
  }
  
  let attempts = 0;
  
  const checkInterval = setInterval(() => {
    attempts++;
    console.log(`Checking for THREE availability (attempt ${attempts})...`);
    
    if (checkThreeAvailability()) {
      clearInterval(checkInterval);
      threeLoaded = true;
      console.log("THREE is now available!");
      callback();
    } else if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.error("THREE failed to load after multiple attempts!");
      const errorMsg = document.getElementById("error-message");
      if (errorMsg) {
        errorMsg.textContent = "Failed to load 3D library. Please refresh the page.";
        errorMsg.style.display = "block";
      }
    }
  }, 100);
}

// Initialize the app once dependencies are available
function initializeApp() {
  console.log("Dependencies loaded, initializing app...");
  
  // At this point, we know THREE is loaded, so we can start the game
  if (typeof window.startGame === 'function') {
    window.startGame();
  } else {
    console.error("startGame function is not defined!");
  }
}

// Expose functions to global threeLoader object
window.threeLoader.waitForThree = waitForThree;
window.threeLoader.checkThreeAvailability = checkThreeAvailability;
window.threeLoader.initializeApp = initializeApp;


// Export the functions for use in other modules
window.threeLoader = {
  waitForThree,
  initializeApp
};
