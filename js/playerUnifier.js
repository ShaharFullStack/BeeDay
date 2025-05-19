// Player Unifier: Ensures consistent player name handling across the game
// This file should be loaded after auth.js, gameState.js but before game.js

// Create the unifier object
const playerUnifier = {
  // Cache last known player name to detect changes
  _lastPlayerName: null,
    // Get the player's name consistently from any available source
  getPlayerName: function() {
    // Priority chain for name sources
    let playerName = null;
    
    // Log what we're looking at
    console.log("Auth user:", window.user ? `${window.user.name} (logged in: ${window.user.isLoggedIn})` : "undefined");
    console.log("GameState user:", window.gameState?.currentUser?.name || "undefined");
    
    // 1. Try auth user first as the source of truth (direct from authentication)
    if (window.user && window.user.isLoggedIn === true && window.user.name) {
      playerName = window.user.name;
      console.log("Using player name from auth user:", playerName);
      
      // Sync auth user name to gameState if needed
      if (window.gameState && window.gameState.currentUser && 
          window.gameState.currentUser.name !== playerName) {
        console.log("Syncing auth user name to gameState");
        window.gameState.currentUser.name = playerName;
      }
    }
    // 2. Then try gameState as fallback
    else if (window.gameState && window.gameState.currentUser && window.gameState.currentUser.name) {
      playerName = window.gameState.currentUser.name;
      console.log("Using player name from gameState:", playerName);
    } 
    // 3. Fallback to fixed string
    else {
      playerName = "Player";
      console.log("No player name found, using default");
    }
    
    return playerName;
  },
    // Update all player name references throughout the UI
  updateAllNames: function() {
    const playerName = this.getPlayerName();
    const playerNameElements = document.querySelectorAll("[id*='player-name'], [id*='home-player-name']");
    
    // Log update only when name actually changes
    const nameChanged = this._lastPlayerName !== null && this._lastPlayerName !== playerName;
    if (nameChanged) {
      console.log(`Player name changed from "${this._lastPlayerName}" to "${playerName}"`);
    }
    
    console.log(`Updating ${playerNameElements.length} player name elements to: ${playerName}`);
    
    // Track if we need a multiplayer update
    let needsMultiplayerUpdate = nameChanged;
    
    playerNameElements.forEach(element => {
      // Only animate if actually changing to a different name
      const currentName = element.textContent;
      
      // Update content
      element.textContent = playerName;
      
      // Check if this element has a change
      if (currentName !== playerName && currentName !== "Player") {
        // Add highlight animation
        element.classList.remove("name-updated");
        void element.offsetWidth; // Force reflow to restart animation
        element.classList.add("name-updated");
        
        // This change means we need a multiplayer update
        needsMultiplayerUpdate = true;
      }
    });
    
    // Update multiplayer if available and if we have a name change
    if (needsMultiplayerUpdate && 
        window.multiplayerConnection && 
        typeof window.multiplayerConnection.updatePlayerInfo === 'function') {
      console.log("Sending player name update to multiplayer:", playerName);
      window.multiplayerConnection.updatePlayerInfo({name: playerName});
    }
    
    // Update last known name
    this._lastPlayerName = playerName;
    
    return playerName;
  },
  // Initialize the unifier
  init: function() {
    console.log("PlayerUnifier initializing");
    
    // Create backward-compatible global functions
    window.updateAllPlayerNames = this.updateAllNames.bind(this);
    window.updatePlayerNames = this.updateAllNames.bind(this);
    window.updatePlayerName = this.updateAllNames.bind(this);
    window.getPlayerName = this.getPlayerName.bind(this);
    
    // Ensure auth user is loaded from localStorage if available
    if (window.user && !window.user.isLoggedIn) {
      console.log("Checking localStorage for saved user...");
      const savedUser = localStorage.getItem("beeGame_user");
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser && parsedUser.isLoggedIn && parsedUser.name) {
            console.log("Found saved user in localStorage:", parsedUser.name);
            window.user = parsedUser;
          }
        } catch (e) {
          console.error("Error parsing saved user:", e);
        }
      }
    }
    
    // Do an initial update
    this.updateAllNames();
    
    // Hook into gameState
    if (window.gameState) {
      // Hook into syncWithUserAccount
      if (typeof window.gameState.syncWithUserAccount === 'function') {
        const originalSync = window.gameState.syncWithUserAccount;
        window.gameState.syncWithUserAccount = function() {
          // Call original function
          originalSync.apply(window.gameState, arguments);
          // Then update names
          playerUnifier.updateAllNames();
        };
      }
      
      // Watch for changes to currentUser
      this._setupPropertyWatcher(window.gameState, 'currentUser', () => {
        console.log("gameState.currentUser changed, updating names");
        this.updateAllNames();
      });
    }
    
    // Watch for changes to window.user
    if (window.user) {
      this._setupPropertyWatcher(window.user, 'name', () => {
        console.log("user.name changed, updating names");
        this.updateAllNames();
      });
    }
    
    // Set up polling to catch any missed changes
    this._startPolling();
    
    console.log("PlayerUnifier initialization complete");
  },
  
  // Helper to watch for property changes
  _setupPropertyWatcher: function(obj, prop, callback) {
    if (!obj) return;
    
    let value = obj[prop];
    Object.defineProperty(obj, prop, {
      get: function() {
        return value;
      },
      set: function(newValue) {
        const oldValue = value;
        value = newValue;
        
        if (oldValue !== newValue && typeof callback === 'function') {
          callback(newValue, oldValue);
        }
      },
      enumerable: true,
      configurable: true
    });
  },
  
  // Polling as a fallback mechanism
  _startPolling: function() {
    // Set up a polling interval to check for name changes that might have been missed
    this._pollingInterval = setInterval(() => {
      const currentName = this.getPlayerName();
      if (currentName !== this._lastPlayerName) {
        console.log("Name change detected by polling");
        this.updateAllNames();
      }
    }, 5000); // Check every 5 seconds
  }
};

// Special function to force refresh all names from auth
playerUnifier.forceRefreshFromAuth = function() {
  console.log("Forcing refresh of player names from auth");
  
  // Check if auth user is available
  if (window.user && window.user.isLoggedIn && window.user.name) {
    console.log("Auth user found:", window.user.name);
    
    // Make sure gameState is updated
    if (window.gameState && window.gameState.currentUser) {
      if (window.gameState.currentUser.name !== window.user.name) {
        console.log(`Updating gameState user from "${window.gameState.currentUser.name}" to "${window.user.name}"`);
        window.gameState.currentUser.name = window.user.name;
      }
    }
    
    // Update UI
    this.updateAllNames();
    return true;
  } else {
    console.log("No auth user found or user not logged in");
    return false;
  }
};

// Initialize the unifier when the page is loaded
document.addEventListener("DOMContentLoaded", function() {
  // Wait a short moment for all other scripts to load
  setTimeout(function() {
    playerUnifier.init();
    
    // Set up additional checks after auth might be ready
    setTimeout(() => {
      if (window.user && window.user.isLoggedIn) {
        playerUnifier.forceRefreshFromAuth();
      }
    }, 1000);
    
    // Check again after the game might have started
    setTimeout(() => {
      if (window.user && window.user.isLoggedIn) {
        playerUnifier.forceRefreshFromAuth();
      }
    }, 2000);
  }, 500);
});

// Export to global scope
window.playerUnifier = playerUnifier;
