// Button fix script for Bee Day game

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
  console.log("Button fix script loaded");
  
  // Fix the home start button
  setTimeout(fixStartButton, 1000);
});

// Function to fix the start button
function fixStartButton() {
  // Find the start button
  const homeStartBtn = document.getElementById("home-start-btn");
  
  if (homeStartBtn) {
    console.log("Found home-start-btn, adding click handler");
    
    // Remove any existing listeners by cloning
    const newBtn = homeStartBtn.cloneNode(true);
    homeStartBtn.parentNode.replaceChild(newBtn, homeStartBtn);
      // Add new click listener
    newBtn.addEventListener("click", function() {
      console.log("START BUTTON CLICKED");
      
      // Hide home page
      const homePage = document.getElementById("home-page");
      if (homePage) {
        homePage.style.display = "none";
      }
        // Show game container
      const gameContainer = document.getElementById("game-container");
      if (gameContainer) {
        gameContainer.style.display = "block";
          // Update the player name in the game container
        if (typeof window.updateAllPlayerNames === 'function') {
          console.log("Updating player names via updateAllPlayerNames function");
          window.updateAllPlayerNames();
        } else if (typeof window.updatePlayerNames === 'function') {
          console.log("Updating player names via updatePlayerNames function");
          window.updatePlayerNames();
        } else if (window.gameState && window.gameState.currentUser && typeof updateUI === 'function') {
          console.log("Updating UI with current user:", window.gameState.currentUser.name);
          updateUI();
        }
      }
      
      // Start the game after a short delay
      setTimeout(function() {
        if (typeof window.startGame === 'function') {
          console.log("Starting game via startGame()");
          window.startGame();
        } else {
          console.error("startGame function not found");
        }
      }, 100);
    });
  } else {
    console.error("Could not find home-start-btn");
    
    // Try to find by class instead
    const startButtons = document.getElementsByClassName("start-game-btn");
    if (startButtons.length > 0) {
      console.log("Found start buttons by class:", startButtons.length);
      
      // Add click handler to each
      for (let i = 0; i < startButtons.length; i++) {
        const btn = startButtons[i];
        console.log("Adding click handler to button:", btn.id);
        
        // Clone to remove existing handlers
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener("click", function() {
          console.log("START BUTTON CLICKED (via class)");
          
          // Hide all potential parent containers
          const containers = [
            document.getElementById("home-page"),
            document.getElementById("login-page")
          ];
          
          for (const container of containers) {
            if (container) {
              container.style.display = "none";
            }
          }          // Show game container
          const gameContainer = document.getElementById("game-container");
          if (gameContainer) {
            gameContainer.style.display = "block";
              // Update the player name in the game container
            if (typeof window.updateAllPlayerNames === 'function') {
              console.log("Updating player names via updateAllPlayerNames function (via class)");
              window.updateAllPlayerNames();
            } else if (typeof window.updatePlayerNames === 'function') {
              console.log("Updating player names via updatePlayerNames (via class)");
              window.updatePlayerNames();
            } else if (window.gameState && window.gameState.currentUser && typeof updateUI === 'function') {
              console.log("Updating UI with current user (via class):", window.gameState.currentUser.name);
              updateUI();
            }
          }
          
          // Start the game after a short delay
          setTimeout(function() {
            if (typeof window.startGame === 'function') {
              console.log("Starting game via startGame()");
              window.startGame();
            } else {
              console.error("startGame function not found");
            }
          }, 100);
        });
      }
    }
  }
}
