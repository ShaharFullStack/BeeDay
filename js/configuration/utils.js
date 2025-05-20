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

// Apply styles based on device type
function applyDeviceSpecificStyles() {
  try {
    // The CSS media queries handle most styling, but we might need to adjust some elements dynamically
    if (isMobile) {
      const desktopControls = document.querySelector(".desktop-controls");
      const mobileControls = document.querySelector(".mobile-controls");
      const joystickLeft = document.getElementById("joystick-left");
      const joystickRight = document.getElementById("joystick-right");
      const mobileButtons = document.getElementById("mobile-buttons");
      const mobileHeightControls = document.getElementById("mobile-height-controls");
      const pointerLockInfo = document.getElementById("pointer-lock-info");
      const tiltNotification = document.getElementById("tilt-notification");
      
      if (desktopControls) desktopControls.style.display = "none";
      if (mobileControls) mobileControls.style.display = "block";
      if (joystickLeft) joystickLeft.style.display = "block";
      if (joystickRight) joystickRight.style.display = "block";
      if (mobileButtons) mobileButtons.style.display = "block";
      if (mobileHeightControls) mobileHeightControls.style.display = "block";
      if (pointerLockInfo) pointerLockInfo.style.display = "none";
      if (tiltNotification) tiltNotification.style.display = "block";
      
      // Force-disable any CSS media queries that might hide mobile controls
      document.body.classList.add("mobile-device");
      
      // Log to console that mobile controls are enabled
      console.log("Mobile controls enabled");
    } else {
      const desktopControls = document.querySelector(".desktop-controls");
      const mobileControls = document.querySelector(".mobile-controls");
      const joystickLeft = document.getElementById("joystick-left");
      const joystickRight = document.getElementById("joystick-right");
      const mobileButtons = document.getElementById("mobile-buttons");
      const mobileHeightControls = document.getElementById("mobile-height-controls");
      const tiltNotification = document.getElementById("tilt-notification");
      
      if (desktopControls) desktopControls.style.display = "block";
      if (mobileControls) mobileControls.style.display = "none";
      if (joystickLeft) joystickLeft.style.display = "none";
      if (joystickRight) joystickRight.style.display = "none";
      if (mobileButtons) mobileButtons.style.display = "none";
      if (mobileHeightControls) mobileHeightControls.style.display = "none";
      if (tiltNotification) tiltNotification.style.display = "none";
      
      // Ensure desktop mode is enabled
      document.body.classList.remove("mobile-device");
      
      // Log to console that desktop controls are enabled
      console.log("Desktop controls enabled");
    }
  } catch (error) {
    console.error("Error applying device-specific styles:", error);
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