// Utility functions

// Show message in the message box
let messageTimeout;
function showMessage(text, duration = 2000) {
  const messageBox = document.getElementById("message-box");
  messageBox.textContent = text;
  messageBox.style.display = "block";
  clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => {
    messageBox.style.display = "none";
  }, duration);
}

// Apply styles based on device type
function applyDeviceSpecificStyles() {
  // The CSS media queries handle most styling, but we might need to adjust some elements dynamically
  if (isMobile) {
    document.querySelector(".desktop-controls").style.display = "none";
    document.querySelector(".mobile-controls").style.display = "block";    // Show joysticks and action button
    document.getElementById("joystick-left").style.display = "block";
    document.getElementById("joystick-right").style.display = "block";
    document.getElementById("mobile-buttons").style.display = "block";
    document.getElementById("height-controls").style.display = "flex";

    // Hide pointer lock info
    document.getElementById("pointer-lock-info").style.display = "none";
  } else {
    document.querySelector(".desktop-controls").style.display = "block";
    document.querySelector(".mobile-controls").style.display = "none";    // Hide all mobile controls
    document.getElementById("joystick-left").style.display = "none";
    document.getElementById("joystick-right").style.display = "none";
    document.getElementById("mobile-buttons").style.display = "none";
    document.getElementById("height-controls").style.display = "none";
    document.getElementById("tilt-notification").style.display = "none";
  }
}

// Request device orientation permission on iOS devices
function requestDeviceOrientationPermission() {
  if (deviceOrientationPermissionRequested) return;

  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    // iOS 13+ requires permission
    document.body.addEventListener(
      "click",
      () => {
        if (!deviceOrientationPermissionRequested) {
          DeviceOrientationEvent.requestPermission()
            .then((permissionState) => {
              if (permissionState === "granted") {
                window.addEventListener(
                  "deviceorientation",
                  handleDeviceOrientation
                );
              }
              deviceOrientationPermissionRequested = true;
            })
            .catch(console.error);
        }
      },
      { once: true }
    );
  } else {
    // Non-iOS devices
    window.addEventListener("deviceorientation", handleDeviceOrientation);
    deviceOrientationPermissionRequested = true;
  }
}

// Handle device orientation for mobile tilt detection
function handleDeviceOrientation(event) {
  if (!hasTilted && (Math.abs(event.beta) > 25 || Math.abs(event.gamma) > 25)) {
    hasTilted = true;
    document.getElementById("tilt-notification").style.display = "none";
    showMessage("Device tilted! You're ready to fly.", 2000);
  }
}

// Resize handler for window
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Utility functions for the game

// Detect if running on a mobile device
function detectMobile() {
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // Add classes to body for CSS targeting
  document.body.classList.add(isMobile ? "mobile" : "desktop");
  
  // On mobile, prevent default touch actions that might interfere with game controls
  if (isMobile) {
    // Prevent default touch actions like scrolling, zooming, etc.
    document.addEventListener('touchmove', function(e) {
      if (e.target.id !== 'home-page' && !e.target.closest('#controls-info')) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Disable context menu on long-press
    document.addEventListener('contextmenu', function(e) {
      if (e.target.id !== 'home-page') {
        e.preventDefault();
      }
    });
  }
}