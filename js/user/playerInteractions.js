// Player interaction handler for multiplayer mode
// This handles player-to-player interactions in the multiplayer bee game
// Guest name customization for Bee Day Game

// Handle guest player name customization
const guestNameHandler = {
  // Initialize guest name functionality
  init: function() {
    // Get DOM elements
    const guestNameContainer = document.getElementById('guest-name-container');
    const guestNameInput = document.getElementById('guest-name-input');
    const guestNameSaveBtn = document.getElementById('guest-name-save');
    
    // Check if user is a guest
    if (window.user && window.user.isGuest) {
      // Show the name customization container
      guestNameContainer.style.display = 'flex';
      
      // Pre-populate with current name (if available)
      const currentName = window.user.name || '';
      guestNameInput.value = currentName.replace('Guest-', '');
      
      // Add event listener for save button
      guestNameSaveBtn.addEventListener('click', this.saveGuestName);
    } else {
      // Hide the container for non-guest users
      guestNameContainer.style.display = 'none';
    }
  },
  
  // Save the custom guest name
  saveGuestName: function() {
    const guestNameInput = document.getElementById('guest-name-input');
    let newName = guestNameInput.value.trim();
    
    // Validation
    if (newName.length < 2) {
      showMessage("Please enter a name with at least 2 characters", 2000);
      return;
    }
    
    // Max length check (already have maxlength in HTML, but double-check)
    if (newName.length > 15) {
      newName = newName.substring(0, 15);
    }
    
    // Store the new name
    if (window.user) {
      // Update auth user object
      window.user.name = newName;
      
      // Also update in gameState if available
      if (window.gameState && window.gameState.currentUser) {
        window.gameState.currentUser.name = newName;
      }
      
      // Update all UI elements that show the player name
      if (typeof window.updateAllPlayerNames === 'function') {
        window.updateAllPlayerNames();
      }
      
      // Save to localStorage to persist
      localStorage.setItem('beeGame_guestName', newName);
      
      // Show success message
      showMessage(`Your name has been updated to "${newName}"!`, 2000);
    }
  },
  
  // Load a previously saved guest name (if any)
  loadSavedGuestName: function() {
    if (window.user && window.user.isGuest) {
      const savedName = localStorage.getItem('beeGame_guestName');
      if (savedName) {
        window.user.name = savedName;
        
        // Also update in gameState if available
        if (window.gameState && window.gameState.currentUser) {
          window.gameState.currentUser.name = savedName;
        }
        
        // Update all UI elements that show the player name
        if (typeof window.updateAllPlayerNames === 'function') {
          window.updateAllPlayerNames();
        }
      }
    }
  }
};

// Initialize when the home page is shown
document.addEventListener("DOMContentLoaded", function() {
  // Wait for home page to become visible
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === "style" && 
          document.getElementById("home-page").style.display !== "none") {
        console.log("Home page now visible, initializing guest name customization");
        guestNameHandler.init();
      }
    });
  });
  
  const homePage = document.getElementById("home-page");
  if (homePage) {
    observer.observe(homePage, { attributes: true });
  }
  
  // Also check if we have a saved guest name to load
  guestNameHandler.loadSavedGuestName();
});

// Expose globally
window.guestNameHandler = guestNameHandler;

const playerInteractions = {
  // Track nearby players
  nearbyPlayers: new Set(),
  
  // Check for proximity between players
  checkPlayerProximity: function() {
    // Only check if multiplayer is active and connected
    if (!window.multiplayer || !window.multiplayer.isConnected || !window.bee) {
      return;
    }
    
    // Get the current player position
    const currentPlayerPos = window.bee.position;
    const previousNearbyPlayers = new Set(this.nearbyPlayers);
    this.nearbyPlayers.clear();
    
    // Check distance to other players
    window.multiplayer.players.forEach(player => {
      // Skip if this is the current player
      if (window.gameState && player.id === window.gameState.currentUser.id) {
        return;
      }
      
      // Calculate distance
      const dx = player.position.x - currentPlayerPos.x;
      const dy = player.position.y - currentPlayerPos.y;
      const dz = player.position.z - currentPlayerPos.z;
      const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      // If player is nearby (within 10 units)
      if (distance < 10) {
        // Add to nearby players set
        this.nearbyPlayers.add(player.id);
        
        // If this is a new nearby player, notify
        if (!previousNearbyPlayers.has(player.id)) {
          this.onPlayerApproach(player);
        }
      } else if (previousNearbyPlayers.has(player.id)) {
        // Player was nearby but now moved away
        this.onPlayerLeave(player);
      }
    });
  },
  
  // Event: when another player approaches
  onPlayerApproach: function(player) {
    // Show a message about the nearby player
    if (typeof showMessage === 'function') {
      showMessage(`${player.name} is buzzing nearby! (${player.honeyCollected} 🍯)`, 3000);
    }
    
    // Create a small visual effect on the other player's bee
    const playerObj = window.otherPlayerObjects?.get(player.id);
    if (playerObj && playerObj.mesh) {
      // Highlight effect - make bee glow momentarily
      const originalColors = [];
      
      // Store original colors and change to highlighted color
      playerObj.mesh.traverse(child => {
        if (child.material && child.material.color) {
          originalColors.push({
            object: child,
            color: child.material.color.clone()
          });
          
          // Brighten the color
          const c = child.material.color;
          child.material.emissive = new THREE.Color(c.r * 0.5, c.g * 0.5, c.b * 0.5);
        }
      });
      
      // Restore original colors after a delay
      setTimeout(() => {
        originalColors.forEach(item => {
          item.object.material.emissive = new THREE.Color(0, 0, 0);
        });
      }, 2000);
    }
  },
  
  // Event: when another player leaves proximity
  onPlayerLeave: function(player) {
    // Optional feedback that player has left proximity
    // This is kept subtle to avoid too many notifications
    console.log(`${player.name} has flown away`);
  },
  
  // Handle when another player collects honey
  onPlayerCollectHoney: function(player, amount) {
    // Only show notification if player is nearby
    if (this.nearbyPlayers.has(player.id)) {
      // Amplified visual effect for nearby players
      const playerObj = window.otherPlayerObjects?.get(player.id);
      if (playerObj && playerObj.mesh) {
        // Create more particles
        if (window.visualEffects && typeof window.visualEffects.createHoneyEffect === 'function') {
          const particles = window.visualEffects.createHoneyEffect(playerObj.mesh.position);
          particles.scale.set(2, 2, 2); // Larger effect
        }
      }
      
      // More prominent notification
      if (typeof notificationSystem !== 'undefined') {
        notificationSystem.addNotification(player.name, amount);
      }
    }
  }
};

// Start proximity check loop when the game starts
document.addEventListener("DOMContentLoaded", function() {
  // Check player proximity every second
  setInterval(() => {
    if (window.multiplayer && window.multiplayer.isConnected) {
      playerInteractions.checkPlayerProximity();
    }
  }, 1000);
});

// Expose globally
window.playerInteractions = playerInteractions;


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
