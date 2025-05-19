// World creation and management

// Create and set up the basic world elements (ground, lighting)
function setupWorld() {
  setupLighting();
  createGround(1000); // Much larger ground plane
}

// Setup scene lighting
function setupLighting() {
  // Brighter ambient light for pastel look
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);
  
  // Softer directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(70, 100, 60);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 300;
  directionalLight.shadow.camera.left = -150;
  directionalLight.shadow.camera.right = 150;
  directionalLight.shadow.camera.top = 150;
  directionalLight.shadow.camera.bottom = -150;
  scene.add(directionalLight);
  
  // Set fog to match sky color for better depth
  scene.fog = new THREE.Fog(SKY_COLOR, 100, 400);
  
  // Set sky color
  scene.background = new THREE.Color(SKY_COLOR);
}

// Create the ground plane with hexagonal pattern
function createGround(size) {
  try {
    // Create ground plane with a subtle grid for the low-poly look
    const segmentCount = 100;
    const groundGeometry = new THREE.PlaneGeometry(size, size, segmentCount, segmentCount);
    
    // Apply gentle waves to the ground to make it more interesting
    // Use buffer attribute directly for newer versions of Three.js
    const positionAttribute = groundGeometry.getAttribute('position');
    
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      // Add gentle wavy pattern
      positionAttribute.setZ(i, Math.sin(x * 0.05) * Math.sin(y * 0.05) * 1.0);
    }
    
    groundGeometry.computeVertexNormals();
    
    // Using MeshPhongMaterial which supports flatShading
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: GROUND_COLOR,
      flatShading: true,
      wireframe: false
    });
    
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add hexagon pattern overlay
    createHexagonPattern(size);
  } catch (error) {
    console.error("Error creating ground:", error);
  }
}

// Create hexagonal pattern overlay for the ground
function createHexagonPattern(size) {
  try {
    const hexSize = 10;
    const hexGeometry = new THREE.CircleGeometry(hexSize, 6);
    const hexMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      wireframe: true
    });
    
    const hexGroup = new THREE.Group();
    
    const rows = Math.ceil(size / (hexSize * 1.5));
    const cols = Math.ceil(size / (hexSize * Math.sqrt(3)));
    
    for (let row = -rows/2; row < rows/2; row++) {
      for (let col = -cols/2; col < cols/2; col++) {
        const hex = new THREE.Mesh(hexGeometry, hexMaterial);
        
        // Position hexagons in a grid with offset for every other row
        hex.position.x = col * hexSize * Math.sqrt(3);
        hex.position.z = row * hexSize * 1.5;
        
        // Offset every other row
        if (row % 2 !== 0) {
          hex.position.x += hexSize * Math.sqrt(3) / 2;
        }
        
        // Rotate to align flat sides with the grid
        hex.rotation.x = -Math.PI / 2;
        
        hexGroup.add(hex);
      }
    }
    
    hexGroup.position.y = 0.1; // Slight offset to avoid z-fighting
    scene.add(hexGroup);
  } catch (error) {
    console.error("Error creating hexagon pattern:", error);
  }
}