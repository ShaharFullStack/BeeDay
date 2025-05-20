// This file ensures gameState and user objects are properly synchronized
// It runs after both auth.js and gameState.js have loaded

(function() {
  // Function to check and sync gameState with user
  function checkAndSyncGameState() {
    console.log("GameState/Auth Synchronizer - Running check");
    
    // Check if window.gameState exists
    if (!window.gameState) {
      console.error("GameState not found on window object!");
      
      // Try to recover if gameState exists but isn't assigned to window
      if (typeof gameState !== 'undefined') {
        console.log("Found gameState variable, assigning to window.gameState");
        window.gameState = gameState;
      }
    }
    
    // Check if window.user exists and is logged in
    if (window.user && window.user.isLoggedIn) {
      console.log("Auth user is logged in:", window.user.name);
      
      // Check if gameState needs to be synced with auth user
      if (window.gameState && 
          (!window.gameState.currentUser || 
           window.gameState.currentUser.name !== window.user.name)) {
        
        console.log("Syncing gameState with auth user");
        
        // Create currentUser in gameState if it doesn't exist
        if (!window.gameState.currentUser) {
          window.gameState.currentUser = {
            id: window.user.id,
            name: window.user.name,
            isGuest: window.user.isGuest || window.user.id?.startsWith("guest-") || false
          };
          console.log("Created new currentUser in gameState:", window.gameState.currentUser.name);
        } else {
          // Update existing currentUser
          window.gameState.currentUser.name = window.user.name;
          window.gameState.currentUser.isGuest = window.user.isGuest || window.user.id?.startsWith("guest-") || false;
          console.log("Updated gameState user name to:", window.gameState.currentUser.name);
        }
      }
    }
    
    // Log the current state
    console.log("Sync Check - Auth user:", window.user?.name || "undefined");
    console.log("Sync Check - GameState user:", window.gameState?.currentUser?.name || "undefined");
  }
  
  // Check immediately if document is already loaded
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(checkAndSyncGameState, 100);
  }
  
  // Also check when the DOM is fully loaded
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(checkAndSyncGameState, 500);
    
    // And check again after a longer delay to catch any late initialization
    setTimeout(checkAndSyncGameState, 2000);
  });
  
  // Check when the home page becomes visible
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === "style" && 
          document.getElementById("home-page")?.style.display !== "none") {
        console.log("Home page now visible, running gameState sync check");
        checkAndSyncGameState();
      }
    });
  });
  
  // Start observing when document is ready
  document.addEventListener("DOMContentLoaded", function() {
    const homePage = document.getElementById("home-page");
    if (homePage) {
      observer.observe(homePage, { attributes: true });
    }
  });
})();