// Player interaction handler for multiplayer mode
// This handles player-to-player interactions in the multiplayer bee game

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
