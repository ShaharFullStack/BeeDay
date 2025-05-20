// Game state management for multiplayer features

// Global state object
const gameState = {
  // User information
  currentUser: null,
  
  // Game progress
  playerStats: {
    honeyCollected: 0,
    highScore: 0,
    playTime: 0,
    lastPlayed: null
  },
  
  // Multiplayer-related data
  multiplayerEnabled: false,
  onlinePlayers: [],
    // Initialize the game state
  init: function() {
    console.log("Initializing game state...");
    this.loadState();
    
    // Give auth.js a chance to load the user
    if (window.user && window.user.isLoggedIn) {
      console.log("User already loaded, syncing immediately", window.user.name);
      this.syncWithUserAccount();
    } else {
      console.log("User not loaded yet, will sync after a delay");
      // Try again after a short delay to give auth.js time to load
      setTimeout(() => {
        console.log("Delayed sync with user account");
        this.syncWithUserAccount();
      }, 100);
    }
  },
  
  // Load saved state from localStorage
  loadState: function() {
    try {
      const savedState = localStorage.getItem("beeGame_state");
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        // Copy saved properties to the current state
        if (parsedState.playerStats) {
          this.playerStats = parsedState.playerStats;
        }
        
        console.log("Game state loaded:", this.playerStats);
      } else {
        console.log("No saved game state found, using defaults");
      }
    } catch (error) {
      console.error("Error loading game state:", error);
    }
  },
  
  // Save current state to localStorage
  saveState: function() {
    try {
      // Update last played timestamp
      this.playerStats.lastPlayed = new Date().toISOString();
      
      // Save to localStorage
      localStorage.setItem("beeGame_state", JSON.stringify({
        playerStats: this.playerStats,
        multiplayerEnabled: this.multiplayerEnabled
      }));
      
      console.log("Game state saved");
    } catch (error) {
      console.error("Error saving game state:", error);
    }
  },  // Sync state with user account from auth.js
  syncWithUserAccount: function() {
    // Get current user from auth.js
    const authUser = window.user;
    
    if (authUser && authUser.isLoggedIn) {
      // Check if we already have a currentUser and just need to update its name
      const previousName = this.currentUser?.name;
      
      if (this.currentUser && previousName !== authUser.name) {
        console.log(`Updating existing user name from "${previousName}" to "${authUser.name}"`);
        this.currentUser.name = authUser.name;
        
        // Trigger special name change notification if shown in-game
        if (typeof showMessage === 'function' && document.getElementById('game-container')?.style.display !== 'none') {
          showMessage(`Player name updated to: ${authUser.name}`, 3000);
        }
      } else {
        // Create new currentUser object
        this.currentUser = {
          id: authUser.id,
          name: authUser.name,
          isGuest: authUser.id.startsWith("guest-")
        };
      }
      
      console.log("Synced gameState user with auth user:", this.currentUser.name);
      
      // Update UI to reflect the current user - try all available methods
      if (typeof window.playerUnifier?.updateAllNames === 'function') {
        window.playerUnifier.updateAllNames();
      } else if (typeof window.updateAllPlayerNames === 'function') {
        window.updateAllPlayerNames();
      } else if (typeof updateUI === 'function') {
        updateUI();
      }
      
      // If this is a logged-in user (not guest), we could load their saved data 
      // from a server in a real multiplayer implementation
      if (!this.currentUser.isGuest) {
        console.log("Non-guest user logged in, would sync with server in multiplayer mode");
        // In a real implementation, we would make an API call here to get the user's saved data
      }
    } else {
      this.currentUser = null;
    }
  },
  
  // Update honey score
  updateHoney: function(amount) {
    this.playerStats.honeyCollected += amount;
    
    // Update high score if needed
    if (this.playerStats.honeyCollected > this.playerStats.highScore) {
      this.playerStats.highScore = this.playerStats.honeyCollected;
    }
    
    // Save state on updates
    this.saveState();
    
    // In multiplayer mode, we would sync this with the server
    if (this.multiplayerEnabled && this.currentUser && !this.currentUser.isGuest) {
      this.syncScoreWithServer();
    }
  },
  
  // Mock function for syncing score with server
  syncScoreWithServer: function() {
    console.log("Would sync score with server:", this.playerStats.honeyCollected);
    // In a real implementation, this would be an API call to update the user's score
  },
  
  // Get leaderboard data
  getLeaderboard: function() {
    // In a real implementation, this would fetch leaderboard data from the server
    // For now, we'll return a mock leaderboard
    return [
      { name: "TestPlayer1", score: 1000 },
      { name: "TestPlayer2", score: 850 },
      { name: "TestPlayer3", score: 720 },
      { name: this.currentUser ? this.currentUser.name : "You", score: this.playerStats.highScore }
    ].sort((a, b) => b.score - a.score);
  },
    // Enable multiplayer mode
  enableMultiplayer: function() {
    if (!this.currentUser) {
      console.warn("Cannot enable multiplayer: no current user");
      return false;
    }
    
    // Allow guests to use multiplayer, but with a warning message
    if (this.currentUser.isGuest) {
      console.warn("Guest user enabling multiplayer with limited functionality");
      if (typeof showMessage === 'function') {
        showMessage("Multiplayer enabled with limited features for guest users. Sign in with Google for full experience.", 5000);
      }
    }
    
    this.multiplayerEnabled = true;
    console.log("Multiplayer mode enabled");
    
    // Save multiplayer preference
    this.saveState();
    
    return true;
  },
  
  // Disable multiplayer mode
  disableMultiplayer: function() {
    this.multiplayerEnabled = false;
    this.onlinePlayers = [];
    console.log("Multiplayer mode disabled");
  }
};

// Initialize game state when the script loads
document.addEventListener("DOMContentLoaded", function() {
  // We'll initialize after a delay to ensure auth.js has loaded the user
  setTimeout(() => {
    gameState.init();
  }, 1000);
});
