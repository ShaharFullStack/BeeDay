// Sound effects system for Bee Day Game

// Sound library
const soundEffects = {
  // Collection of sound effects
  sounds: {
    honeyCollect: {
      src: 'assets/sounds/honey-collect.mp3',
      volume: 0.5,
      preload: true
    },
    playerNearby: {
      src: 'assets/sounds/player-nearby.mp3',
      volume: 0.3,
      preload: true
    },
    connection: {
      src: 'assets/sounds/connection.mp3',
      volume: 0.4,
      preload: false
    },
    error: {
      src: 'assets/sounds/error.mp3',
      volume: 0.4,
      preload: false
    },
    treeCollision: {
      src: 'assets/sounds/error.mp3', // Reuse the error sound for now
      volume: 0.3,
      preload: false
    }
  },
  
  // Cache for loaded audio elements
  audioCache: new Map(),
  
  // Master volume control
  masterVolume: 0.5,
  muted: false,
  
  // Initialize sound system
  init: function() {
    console.log("Initializing sound system...");
    
    // Create audio context if supported
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      this.audioContext = new (AudioContext || webkitAudioContext)();
    }
    
    // Preload sounds marked for preloading
    this.preloadSounds();
    
    // Try to load from local storage
    this.loadSettings();
    
    console.log("Sound system initialized");
  },
  
  // Preload sounds marked for preloading
  preloadSounds: function() {
    for (const [name, config] of Object.entries(this.sounds)) {
      if (config.preload) {
        this.loadSound(name);
      }
    }
  },
  
  // Load a specific sound
  loadSound: function(name) {
    if (!this.sounds[name]) {
      console.warn(`Sound "${name}" not found in library`);
      return null;
    }
    
    // Check if already loaded
    if (this.audioCache.has(name)) {
      return this.audioCache.get(name);
    }
    
    // Create audio element
    try {
      const audio = new Audio();
      audio.src = this.sounds[name].src;
      audio.volume = this.sounds[name].volume * this.masterVolume;
      audio.load();
      
      // Cache the audio element
      this.audioCache.set(name, audio);
      
      return audio;
    } catch (error) {
      console.error(`Failed to load sound "${name}":`, error);
      return null;
    }
  },
  
  // Play a sound by name
  playSound: function(name) {
    // Skip if muted
    if (this.muted) return;
    
    let audio = this.audioCache.get(name);
    
    // Load if not already cached
    if (!audio) {
      audio = this.loadSound(name);
    }
    
    // Play the sound if successfully loaded
    if (audio) {
      try {
        // Reset to beginning if already playing
        audio.currentTime = 0;
        
        // Set volume based on master volume
        audio.volume = this.sounds[name].volume * this.masterVolume;
        
        // Play the sound
        audio.play().catch(error => {
          console.warn(`Failed to play sound "${name}":`, error);
        });
      } catch (error) {
        console.error(`Error playing sound "${name}":`, error);
      }
    }
  },
  
  // Set master volume (0.0 to 1.0)
  setVolume: function(volume) {
    // Ensure volume is between 0 and 1
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    // Update all currently loaded sounds
    this.audioCache.forEach((audio, name) => {
      if (this.sounds[name]) {
        audio.volume = this.sounds[name].volume * this.masterVolume;
      }
    });
    
    // Save settings
    this.saveSettings();
  },
  
  // Toggle mute state
  toggleMute: function() {
    this.muted = !this.muted;
    
    // Save settings
    this.saveSettings();
    
    return this.muted;
  },
  
  // Save settings to localStorage
  saveSettings: function() {
    try {
      localStorage.setItem('beeGame_soundSettings', JSON.stringify({
        masterVolume: this.masterVolume,
        muted: this.muted
      }));
    } catch (error) {
      console.warn("Could not save sound settings:", error);
    }
  },
  
  // Load settings from localStorage
  loadSettings: function() {
    try {
      const settings = JSON.parse(localStorage.getItem('beeGame_soundSettings'));
      if (settings) {
        if (typeof settings.masterVolume === 'number') {
          this.masterVolume = settings.masterVolume;
        }
        if (typeof settings.muted === 'boolean') {
          this.muted = settings.muted;
        }
      }
    } catch (error) {
      console.warn("Could not load sound settings:", error);
    }
  }
};

// Initialize on load
document.addEventListener("DOMContentLoaded", function() {
  soundEffects.init();
  
  // Expose play function globally
  window.playSound = function(name) {
    soundEffects.playSound(name);
  };
});

// Expose for global access
window.soundEffects = soundEffects;
