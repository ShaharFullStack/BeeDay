// Utility functions

// Device detection function
function detectMobile() {
  try {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    console.log("Device detection: " + (isMobile ? "Mobile" : "Desktop"));
    
    // Add a debug message that will appear for a moment to indicate device type
    const errorMsg = document.getElementById("error-message");
    if (errorMsg) {
      errorMsg.textContent = "Device detected: " + (isMobile ? "Mobile" : "Desktop");
      errorMsg.style.display = "block";
      setTimeout(() => {
        errorMsg.style.display = "none";
      }, 3000);
    }
  } catch (error) {
    console.error("Error in device detection:", error);
  }
}

// Expose functions to global scope
window.detectMobile = detectMobile;
window.showMessage = showMessage;
window.applyDeviceSpecificStyles = applyDeviceSpecificStyles;
window.requestDeviceOrientationPermission = requestDeviceOrientationPermission;
window.handleDeviceOrientation = handleDeviceOrientation;
window.onWindowResize = onWindowResize;

// Show message in the message box
let messageTimeout;
function showMessage(text, duration = 2000) {
  try {
    const messageBox = document.getElementById("message-box");
    if (messageBox) {
      messageBox.textContent = text;
      messageBox.style.display = "block";
      messageBox.style.top = "50px"; // Adjust position if needed
      clearTimeout(messageTimeout);
      messageTimeout = setTimeout(() => {
        messageBox.style.display = "none";
      }, duration);
    }
  } catch (error) {
    console.error("Error showing message:", error);
  }
}

// Apply styles based on device type — now CSS-driven, this just sets body class + hides UI noise
function applyDeviceSpecificStyles() {
  try {
    if (isMobile) {
      document.body.classList.add('mobile-device');

      // Hide desktop-only elements
      const pli = document.getElementById('pointer-lock-info');
      if (pli) pli.style.display = 'none';

      // Lower pixel ratio on mobile for performance (max 1.5x)
      if (renderer) {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        renderer.setPixelRatio(dpr);
      }

      // Reduce fog distance on mobile to cut fill-rate
      if (scene && scene.fog) {
        scene.fog.near = 60;
        scene.fog.far  = 200;
      }

      console.log('Mobile styles applied');
    } else {
      document.body.classList.remove('mobile-device');
      if (renderer) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      console.log('Desktop styles applied');
    }
  } catch (error) {
    console.error('Error applying device-specific styles:', error);
  }
}

// Request device orientation permission on iOS devices
function requestDeviceOrientationPermission() {
  try {
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
  } catch (error) {
    console.error("Error requesting device orientation permission:", error);
  }
}

// Handle device orientation for mobile tilt detection
function handleDeviceOrientation(event) {
  try {
    if (!hasTilted && (Math.abs(event.beta) > 25 || Math.abs(event.gamma) > 25)) {
      hasTilted = true;
      const tiltNotification = document.getElementById("tilt-notification");
      if (tiltNotification) {
        tiltNotification.style.display = "none";
      }
      showMessage("Device tilted! You're ready to fly.", 2000);
    }
  } catch (error) {
    console.error("Error handling device orientation:", error);
  }
}

// Resize handler for window
function onWindowResize() {
  try {
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  } catch (error) {
    console.error("Error resizing window:", error);
  }
}