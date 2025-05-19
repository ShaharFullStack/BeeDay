// Player name update helper
document.addEventListener("DOMContentLoaded", function() {
  // Ensure player name is updated when game container becomes visible
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === "attributes" && mutation.attributeName === "style") {
        const gameContainer = document.getElementById("game-container");
        if (gameContainer && gameContainer.style.display !== "none") {
          updatePlayerName();
        }
      }
    });
  });

  const gameContainer = document.getElementById("game-container");
  if (gameContainer) {
    observer.observe(gameContainer, { attributes: true });
  }

  // Also update when game starts
  if (typeof window.startGame === 'function') {
    const originalStartGame = window.startGame;
    window.startGame = function() {
      updatePlayerName();
      return originalStartGame.apply(this, arguments);
    };
  }
});

// Update player name in the UI
function updatePlayerName() {
  // Use the UI function if available
  if (typeof window.updateAllPlayerNames === 'function') {
    window.updateAllPlayerNames();
    return;
  }
  
  // Fallback if the UI function isn't available
  if (window.gameState && window.gameState.currentUser) {
    const playerNameElements = document.querySelectorAll("#player-name");
    playerNameElements.forEach(element => {
      element.textContent = window.gameState.currentUser.name || "Player";
      console.log("Updated player name to:", user.name);
    });
  } else if (window.user && window.user.isLoggedIn) {
    // Fallback to auth.js user if available
    const playerNameElements = document.querySelectorAll("#player-name");
    playerNameElements.forEach(element => {
      element.textContent = window.user.name;
      console.log("Updated player name from auth.js to:", window.user.name);
    });
  } else {
    console.warn("Could not update player name - user data not available");
  }
}
