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
