// Main entry point for the application

// Function to hide controls after 15 seconds
function hideControlsAfterDelay() {
  setTimeout(() => {
    const controlsInfo = document.getElementById("controls-info");
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
  }, 15000); // 15 seconds
}

// Function to handle the homepage to game transition
function initializeHomepage() {
  const startButton = document.getElementById("start-game-btn");
  const homePage = document.getElementById("home-page");
  const gameContainer = document.getElementById("game-container");
  
  startButton.addEventListener("click", () => {
    // Hide homepage and show game
    homePage.style.display = "none";
    gameContainer.style.display = "block";
    
    // Start the game
    startGame();
    
    // Set up the timer to hide controls
    hideControlsAfterDelay();
  });
}

// Start the homepage when the page is loaded
window.onload = function() {
  initializeHomepage();
};