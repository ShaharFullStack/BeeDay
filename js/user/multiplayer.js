const otherPlayerObjects = new Map();

// Track active visual effects
const activeEffects = new Map();

// Track and manage notifications
const notificationSystem = {
  notifications: [],
  maxNotifications: 5,
  notificationContainer: null,

  // Initialize notification system
  init: function () {
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.id = 'notification-container';
    this.notificationContainer.style.position = 'absolute';
    this.notificationContainer.style.right = '20px';
    this.notificationContainer.style.top = '100px';
    this.notificationContainer.style.zIndex = '1000';
    document.getElementById('game-container').appendChild(this.notificationContainer);
  },
  // Add a new notification
  addNotification: function (playerName, honeyAmount) {
    // Generate unique ID for this notification
    const notificationId = Date.now() + '-' + Math.random().toString(36).substr(2, 5);

    // Create notification element
    const notification = document.createElement('div');
    notification.id = `notification-${notificationId}`;
    notification.className = 'honey-notification';

    // Add sound effect attributes for accessibility
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');

    // Use icon and structured content for better readability
    notification.innerHTML = `
      <div>
        <span class="player-name">${playerName}</span> collected 
        <span class="honey-amount">${honeyAmount}</span> honey!
      </div>
    `;

    // Position notification (stacked from bottom to top)
    notification.style.bottom = `${this.notifications.length * 70 + 20}px`;

    // Add to container
    this.notificationContainer.appendChild(notification);

    // Play honey collection sound if available
    if (window.playSound && typeof window.playSound === 'function') {
      window.playSound('honeyCollect');
    }

    // Activate with slight delay for animation
    setTimeout(() => {
      notification.classList.add('active');
    }, 50);

    // Store in our list
    this.notifications.push({
      id: notificationId,
      element: notification,
      createdAt: Date.now()
    });

    // Remove oldest if we have too many
    if (this.notifications.length > this.maxNotifications) {
      const oldest = this.notifications.shift();
      oldest.element.classList.add('exit');
      setTimeout(() => {
        if (oldest.element && oldest.element.parentNode) {
          oldest.element.remove();
        }
      }, 500);
    }

    // Auto-remove after 4 seconds
    setTimeout(() => {
      this.removeNotification(notificationId);
    }, 4000);
  },
  // Remove a notification by ID
  removeNotification: function (notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      const notification = this.notifications[index];

      // Add exit animation class
      notification.element.classList.add('exit');
      notification.element.classList.remove('active');

      // Remove from DOM after animation completes
      setTimeout(() => {
        if (notification.element && notification.element.parentNode) {
          notification.element.remove();
        }
      }, 500);

      // Remove from our array
      this.notifications.splice(index, 1);

      // Reposition remaining notifications with animation
      this.notifications.forEach((n, i) => {
        // Apply new position with transition
        n.element.style.transition = 'bottom 0.3s ease-out';
        n.element.style.bottom = `${i * 70 + 20}px`;

        // Reset transition after animation completes
        setTimeout(() => {
          n.element.style.transition = '';
        }, 300);
      });
    }
  },
};

// Visual effects
const visualEffects = {
  createHoneyEffect: function (position) {
    if (!window.scene || !window.THREE) return null;

    const particles = new THREE.Group();
    const particleCount = 10;

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.2, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xFAA700,
        transparent: true,
        opacity: 0.8
      });
      const particle = new THREE.Mesh(geometry, material);

      // Random position around the center
      particle.position.set(
        position.x + (Math.random() - 0.5) * 2,
        position.y + (Math.random() - 0.5) * 2,
        position.z + (Math.random() - 0.5) * 2
      );

      // Random velocity
      particle.userData.velocity = {
        x: (Math.random() - 0.5) * 0.2,
        y: Math.random() * 0.2 + 0.1,
        z: (Math.random() - 0.5) * 0.2
      };

      particles.add(particle);
    }

    window.scene.add(particles);

    // Animate and remove after 1.5 seconds
    setTimeout(() => {
      if (window.scene) {
        window.scene.remove(particles);
      }
    }, 1500);

    return particles;
  },

  updateParticles: function (particles) {
    if (!particles) return;

    particles.children.forEach(particle => {
      // Move the particle
      particle.position.x += particle.userData.velocity.x;
      particle.position.y += particle.userData.velocity.y;
      particle.position.z += particle.userData.velocity.z;

      // Apply gravity
      particle.userData.velocity.y -= 0.01;

      // Fade out
      if (particle.material) {
        particle.material.opacity -= 0.02;
      }
    });
  }
};

// Multiplayer handler
const multiplayer = {
  // Keep track of connected players
  players: [],

  // Connection status
  isConnected: false,
  // Initialize multiplayer
  init: function () {
    console.log("Initializing multiplayer system...");

    // Check if multiplayer is enabled
    if (!window.gameState || !window.gameState.multiplayerEnabled) {
      console.log("Multiplayer disabled, skipping initialization");
      return;
    }

    // Set up the leaderboard
    this.setupLeaderboard();

    // Add multiplayer HUD
    this.createMultiplayerHUD();

    // Connect to server (mock)
    this.connectToServer();

    // Initialize notification system for player interactions
    if (typeof notificationSystem !== 'undefined') {
      notificationSystem.init();
    }
  },

  // Set up leaderboard UI
  setupLeaderboard: function () {
    // Create the leaderboard container if it doesn't exist
    let leaderboard = document.getElementById("leaderboard");
    if (!leaderboard) {
      leaderboard = document.createElement("div");
      leaderboard.id = "leaderboard";
      leaderboard.className = "game-panel";
      leaderboard.innerHTML = `
        <h3>Leaderboard</h3>
        <div id="leaderboard-entries"></div>
      `;
      document.getElementById("game-container").appendChild(leaderboard);
    }
  },
  // Create multiplayer HUD elements
  createMultiplayerHUD: function () {
    // Create player counter with improved UI
    let playerCounter = document.getElementById("player-counter");
    if (!playerCounter) {
      playerCounter = document.createElement("div");
      playerCounter.id = "player-counter";
      playerCounter.className = "multiplayer-indicator";
      playerCounter.innerHTML = `
        <span id="player-counter-icon"></span>
        <span id="player-counter-number">0</span> Players Online
      `;
      document.getElementById("ui-container").appendChild(playerCounter);
    }

    // Create multiplayer status indicator with visual status
    let statusIndicator = document.getElementById("multiplayer-status");
    if (!statusIndicator) {
      statusIndicator = document.createElement("div");
      statusIndicator.id = "multiplayer-status";
      statusIndicator.className = "multiplayer-indicator status-connecting";
      statusIndicator.innerHTML = `
        <span class="status-indicator"></span>
        <span class="status-text">Connecting...</span>
      `;
      document.getElementById("ui-container").appendChild(statusIndicator);

      // Update status when connection is established
      setTimeout(() => {
        if (this.isConnected) {
          statusIndicator.className = "multiplayer-indicator status-connected";
          statusIndicator.querySelector('.status-text').textContent = "Connected";
        }
      }, 2000);
    }

    // Initialize notification system
    notificationSystem.init();
  },
  // Mock connection to a multiplayer server
  connectToServer: function () {
    console.log("Connecting to multiplayer server...");

    // Update connection status
    if (window.multiplayerStatus) {
      window.multiplayerStatus.connectionStatus = 'connecting';
      window.multiplayerStatus.updateStatusDisplay();
    }

    // Show connection message
    if (typeof showMessage === 'function') {
      showMessage("Connecting to multiplayer server...", 2000);
    }

    // Simulate server connection delay
    setTimeout(() => {
      // Simulate random connection failure (10% chance in development)
      if (Math.random() < 0.1) {
        console.error("Simulated connection failure");

        if (window.multiplayerStatus) {
          window.multiplayerStatus.handleError({
            message: "Could not connect to server (simulated error)"
          });
        }
        return;
      }

      this.isConnected = true;
      console.log("Connected to multiplayer server");

      // Update connection status
      if (window.multiplayerStatus) {
        window.multiplayerStatus.connectionStatus = 'connected';
        window.multiplayerStatus.reconnectAttempts = 0;
        window.multiplayerStatus.updateStatusDisplay();
      }

      // Show success message
      if (typeof showMessage === 'function') {
        showMessage("Multiplayer mode active! You can see other players in the world.", 4000);
      }

      // Get initial players
      this.players = [...mockPlayers];

      // Add current player to the list
      if (window.gameState && window.gameState.currentUser) {
        this.players.push({
          id: window.gameState.currentUser.id,
          name: window.gameState.currentUser.name,
          color: 0xFF0000, // Current player is red
          position: window.bee ? {
            x: window.bee.position.x,
            y: window.bee.position.y,
            z: window.bee.position.z
          } : { x: 0, y: 10, z: 0 },
          honeyCollected: window.gameState.playerStats.honeyCollected
        });
      }

      // Update player count
      this.updatePlayerCount();

      // Create 3D representations of other players
      this.createOtherPlayerObjects();

      // Update leaderboard
      this.updateLeaderboard();

      // Start position update loop
      this.startUpdateLoop();
    }, 1500);
  },
  // Update the player counter
  updatePlayerCount: function () {
    const playerCounter = document.getElementById("player-counter-number");
    if (playerCounter) {
      playerCounter.textContent = this.players.length;

      // Add a small animation effect when player count changes
      playerCounter.style.transform = 'scale(1.2)';
      playerCounter.style.transition = 'transform 0.2s ease-out';
      setTimeout(() => {
        playerCounter.style.transform = 'scale(1)';
      }, 200);
    }
  },
  // Create 3D objects to represent other players
  createOtherPlayerObjects: function () {
    // Only proceed if THREE and scene are available
    if (typeof THREE === 'undefined' || !window.scene) {
      console.warn("Cannot create player objects: THREE or scene not available");
      return;
    }

    // Clear any existing objects
    this.clearOtherPlayerObjects();

    // Create new objects for each player (except the current player)
    this.players.forEach(player => {
      // Skip if this is the current player
      if (window.gameState && player.id === window.gameState.currentUser.id) {
        return;
      }

      // Create a more detailed bee representation
      const beeGroup = new THREE.Group();

      // Create bee body (ellipsoid)
      const bodyGeometry = new THREE.SphereGeometry(1, 12, 12);
      bodyGeometry.scale(1, 0.8, 1.2);
      const bodyMaterial = new THREE.MeshBasicMaterial({ color: player.color });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      beeGroup.add(body);

      // Add stripes
      const addStripe = (yPos, scale = 1) => {
        const stripeGeometry = new THREE.CylinderGeometry(1.01, 1.01, 0.2, 16);
        const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.rotation.x = Math.PI / 2;
        stripe.position.z = yPos;
        stripe.scale.set(scale, 1, 1);
        beeGroup.add(stripe);
      };

      // Add multiple stripes
      addStripe(-0.4, 0.9);
      addStripe(0, 1);
      addStripe(0.4, 0.9);

      // Add wings
      const wingGeometry = new THREE.PlaneGeometry(2, 1.5);
      const wingMaterial = new THREE.MeshBasicMaterial({
        color: 0xCCCCFF,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });

      const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
      leftWing.position.set(-1, 0.5, 0);
      leftWing.rotation.y = Math.PI / 4;
      beeGroup.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
      rightWing.position.set(1, 0.5, 0);
      rightWing.rotation.y = -Math.PI / 4;
      beeGroup.add(rightWing);

      // Add eyes
      const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.4, 0.2, 0.7);
      beeGroup.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.4, 0.2, 0.7);
      beeGroup.add(rightEye);

      // Add stinger
      const stingerGeometry = new THREE.ConeGeometry(0.15, 0.5, 8);
      const stingerMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const stinger = new THREE.Mesh(stingerGeometry, stingerMaterial);
      stinger.position.set(0, 0, -1.3);
      stinger.rotation.x = Math.PI;
      beeGroup.add(stinger);

      // Position the player
      beeGroup.position.set(
        player.position.x,
        player.position.y,
        player.position.z
      );

      // Add player name label with honey count
      const nameCanvas = document.createElement('canvas');
      nameCanvas.width = 256;
      nameCanvas.height = 64;
      const ctx = nameCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${player.name} (${player.honeyCollected} 🍯)`, 128, 32);

      const nameTexture = new THREE.CanvasTexture(nameCanvas);
      const nameMaterial = new THREE.SpriteMaterial({ map: nameTexture });
      const nameSprite = new THREE.Sprite(nameMaterial);
      nameSprite.scale.set(5, 1.25, 1);
      nameSprite.position.y = 2;
      beeGroup.add(nameSprite);

      // Add to scene and store reference
      window.scene.add(beeGroup);
      otherPlayerObjects.set(player.id, {
        mesh: beeGroup,
        lastUpdate: Date.now()
      });
    });

    console.log(`Created ${otherPlayerObjects.size} player representations`);
  },

  // Remove all other player objects from the scene
  clearOtherPlayerObjects: function () {
    if (!window.scene) return;

    // Remove each object from the scene
    otherPlayerObjects.forEach((obj, id) => {
      window.scene.remove(obj.mesh);
    });

    // Clear the map
    otherPlayerObjects.clear();
  },
  // Update the positions of other players
  updateOtherPlayerPositions: function () {
    // Only proceed if we're connected
    if (!this.isConnected) return;

    // In a real implementation, this would get position updates from the server
    // For now, we'll just slightly move the mock players
    this.players.forEach(player => {
      // Skip if this is the current player
      if (window.gameState && player.id === window.gameState.currentUser.id) {
        // Update current player's data
        if (window.bee) {
          player.position.x = window.bee.position.x;
          player.position.y = window.bee.position.y;
          player.position.z = window.bee.position.z;
        }

        player.honeyCollected = window.gameState.playerStats.honeyCollected;
        return;
      }

      // Get the object for this player
      const playerObj = otherPlayerObjects.get(player.id);
      if (!playerObj || !playerObj.mesh) return;

      // Randomly move the player a little
      player.position.x += (Math.random() - 0.5) * 0.5;
      player.position.y += (Math.random() - 0.5) * 0.3;
      player.position.z += (Math.random() - 0.5) * 0.5;

      // Update the position
      playerObj.mesh.position.set(
        player.position.x,
        player.position.y,
        player.position.z
      );
      // Simulate wing flapping
      const wings = playerObj.mesh.children.filter(c =>
        c instanceof THREE.Mesh &&
        c.geometry instanceof THREE.PlaneGeometry
      );

      if (wings.length >= 2) {
        // More realistic wing flapping with vertical movement
        const wingTime = Date.now() / 100;
        const flapSpeed = 0.5 + Math.random() * 0.2; // Slightly random speed for each bee

        // Left wing
        wings[0].rotation.z = Math.sin(wingTime * flapSpeed) * 0.7;
        wings[0].rotation.x = Math.cos(wingTime * flapSpeed) * 0.3;

        // Right wing
        wings[1].rotation.z = -Math.sin(wingTime * flapSpeed) * 0.7;
        wings[1].rotation.x = Math.cos(wingTime * flapSpeed) * 0.3;
      }      // Occasionally update honey count
      if (Math.random() < 0.02) {
        // Store previous honey amount
        const previousHoney = player.honeyCollected;

        // Update honey (random amount between 5-20)
        const honeyGain = 5 + Math.floor(Math.random() * 15);
        player.honeyCollected += honeyGain;

        // Update the label
        this.updatePlayerLabel(player);

        // Show honey collection effect
        const particles = visualEffects.createHoneyEffect(playerObj.mesh.position);

        // Add to effects list for updates if animation loop exists
        if (particles) {
          const effectId = Date.now() + '-' + Math.random();
          activeEffects.set(effectId, {
            particles: particles,
            createdAt: Date.now()
          });
        }

        // Show notification
        notificationSystem.addNotification(player.name, honeyGain);

        // Trigger player interaction event if available
        if (window.playerInteractions && typeof window.playerInteractions.onPlayerCollectHoney === 'function') {
          window.playerInteractions.onPlayerCollectHoney(player, honeyGain);
        }
      }
    });
  },

  // Update a player's label with new honey count
  updatePlayerLabel: function (player) {
    const playerObj = otherPlayerObjects.get(player.id);
    if (!playerObj || !playerObj.mesh) return;

    // Find the name sprite
    const nameSprite = playerObj.mesh.children.find(c => c instanceof THREE.Sprite);
    if (!nameSprite) return;

    // Update the label
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${player.name} (${player.honeyCollected} 🍯)`, 128, 32);

    // Update the texture
    const nameTexture = new THREE.CanvasTexture(canvas);
    nameSprite.material.map = nameTexture;
    nameSprite.material.needsUpdate = true;
  },

  // Update the leaderboard display
  updateLeaderboard: function () {
    const leaderboardEntries = document.getElementById("leaderboard-entries");
    if (!leaderboardEntries) return;

    // Sort players by honey collected
    const sortedPlayers = [...this.players].sort((a, b) => b.honeyCollected - a.honeyCollected);

    // Create the HTML
    let html = "";
    sortedPlayers.slice(0, 5).forEach((player, index) => {
      const isCurrentPlayer = window.gameState && player.id === window.gameState.currentUser.id;
      html += `
        <div class="leaderboard-entry ${isCurrentPlayer ? 'current-player' : ''}">
          <span class="rank">${index + 1}</span>
          <span class="name">${player.name}</span>
          <span class="score">${player.honeyCollected}</span>
        </div>
      `;
    });

    // Update the DOM
    leaderboardEntries.innerHTML = html;
  },
  // Start the position update loop
  startUpdateLoop: function () {
    // Update every 100ms
    setInterval(() => {
      if (this.isConnected) {
        this.updateOtherPlayerPositions();
        this.updateVisualEffects();

        // Only update the leaderboard occasionally to avoid performance issues
        if (Math.random() < 0.05) {
          this.updateLeaderboard();
        }
      }
    }, 100);
  },

  // Update all active visual effects
  updateVisualEffects: function () {
    // Process all active effects
    activeEffects.forEach((effect, id) => {
      // Update particle positions
      visualEffects.updateParticles(effect.particles);

      // Remove old effects (older than 1.5 seconds)
      if (Date.now() - effect.createdAt > 1500) {
        if (window.scene) {
          window.scene.remove(effect.particles);
        }
        activeEffects.delete(id);
      }
    });
  },
  // Clean up multiplayer resources
  cleanup: function () {
    this.isConnected = false;
    this.clearOtherPlayerObjects();

    // Reset connection status
    if (window.multiplayerStatus) {
      window.multiplayerStatus.reset();
    }

    // Remove any notification elements
    const notificationContainer = document.getElementById('notification-container');
    if (notificationContainer) {
      notificationContainer.remove();
    }

    // Remove any fallback messages
    const fallbackMessage = document.querySelector('.fallback-message');
    if (fallbackMessage) {
      fallbackMessage.remove();
    }

    console.log("Multiplayer system cleaned up");
  }
};

// Initialize multiplayer when the game starts
document.addEventListener("DOMContentLoaded", function () {
  // Wait for game container to become visible (indicating game has started)
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.attributeName === "style" &&
        document.getElementById("game-container").style.display !== "none" &&
        window.gameState && window.gameState.multiplayerEnabled) {
        console.log("Game container now visible, initializing multiplayer");
        multiplayer.init();
      }
    });
  });

  const gameContainer = document.getElementById("game-container");
  if (gameContainer) {
    observer.observe(gameContainer, { attributes: true });
  }

  // Also listen for multiplayer toggle
  const checkbox = document.getElementById("multiplayer-checkbox");
  if (checkbox) {
    checkbox.addEventListener("change", function () {
      if (this.checked) {
        // Initialize if the game is already running
        if (document.getElementById("game-container").style.display !== "none") {
          multiplayer.init();
        }
      } else {
        // Clean up if unchecked
        multiplayer.cleanup();
      }
    });
  }
});

// Expose multiplayer globally
window.multiplayer = multiplayer;


// Error handling and status tracking for multiplayer features

const multiplayerStatus = {
  // Status tracking
  connectionStatus: 'disconnected', // 'connecting', 'connected', 'failed', 'disconnected'
  lastError: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 3,

  // Update status display
  updateStatusDisplay: function () {
    const statusIndicator = document.getElementById("multiplayer-status");
    if (!statusIndicator) return;

    // Update class and text based on current status
    statusIndicator.className = `multiplayer-indicator status-${this.connectionStatus}`;

    const statusTextElement = statusIndicator.querySelector('.status-text');
    if (!statusTextElement) return;

    switch (this.connectionStatus) {
      case 'connecting':
        statusTextElement.textContent = 'Connecting...';
        break;
      case 'connected':
        statusTextElement.textContent = 'Connected';
        break;
      case 'failed':
        statusTextElement.textContent = 'Connection Failed';
        break;
      case 'disconnected':
        statusTextElement.textContent = 'Disconnected';
        break;
    }
  },

  // Handle connection errors
  handleError: function (error) {
    console.error('Multiplayer connection error:', error);
    this.lastError = error;

    // Update status
    this.connectionStatus = 'failed';
    this.updateStatusDisplay();

    // Show error message to user
    if (typeof showMessage === 'function') {
      showMessage(`Multiplayer connection error: ${error.message || 'Unknown error'}`, 5000);
    }

    // Attempt to reconnect if we haven't tried too many times
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;

      // Show reconnect message
      if (typeof showMessage === 'function') {
        showMessage(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`, 3000);
      }

      // Set status to connecting
      this.connectionStatus = 'connecting';
      this.updateStatusDisplay();

      // Attempt reconnection after a delay
      setTimeout(() => {
        if (window.multiplayer && typeof window.multiplayer.connectToServer === 'function') {
          window.multiplayer.connectToServer();
        }
      }, 3000); // 3 second delay
    } else {
      // We've tried enough times, show failure message
      if (typeof showMessage === 'function') {
        showMessage('Failed to connect to multiplayer server after multiple attempts. Try again later.', 5000);
      }

      // Offer fallback to single player
      const fallbackMessage = document.createElement('div');
      fallbackMessage.className = 'fallback-message';
      fallbackMessage.innerHTML = `
        <p>Multiplayer is currently unavailable.</p>
        <button id="continue-single-player">Continue in Single Player Mode</button>
      `;

      const gameContainer = document.getElementById('game-container');
      if (gameContainer) {
        gameContainer.appendChild(fallbackMessage);

        // Add event listener to the button
        document.getElementById('continue-single-player').addEventListener('click', () => {
          // Disable multiplayer and remove the message
          if (window.gameState) {
            window.gameState.disableMultiplayer();
          }

          fallbackMessage.remove();

          // Update checkbox state if it exists
          const checkbox = document.getElementById("multiplayer-checkbox");
          if (checkbox) {
            checkbox.checked = false;
          }

          // Show confirmation
          if (typeof showMessage === 'function') {
            showMessage('Continuing in single player mode...', 3000);
          }
        });
      }
    }
  },

  // Reset connection status and attempts
  reset: function () {
    this.connectionStatus = 'disconnected';
    this.lastError = null;
    this.reconnectAttempts = 0;
    this.updateStatusDisplay();
  }
};

// Expose globally
window.multiplayerStatus = multiplayerStatus;
