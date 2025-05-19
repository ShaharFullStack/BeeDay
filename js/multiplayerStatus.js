// Error handling and status tracking for multiplayer features

const multiplayerStatus = {
  // Status tracking
  connectionStatus: 'disconnected', // 'connecting', 'connected', 'failed', 'disconnected'
  lastError: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 3,
  
  // Update status display
  updateStatusDisplay: function() {
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
  handleError: function(error) {
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
  reset: function() {
    this.connectionStatus = 'disconnected';
    this.lastError = null;
    this.reconnectAttempts = 0;
    this.updateStatusDisplay();
  }
};

// Expose globally
window.multiplayerStatus = multiplayerStatus;
