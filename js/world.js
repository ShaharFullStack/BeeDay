// World creation and management

// Create and set up the basic world elements (ground, lighting)
function setupWorld(scene) {
  setupLighting(scene);
  // Note: createGround is now called directly from game.js
}

// Setup scene lighting
function setupLighting(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
  directionalLight.position.set(70, 100, 60); // Adjusted light position
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 300; // Increased shadow camera far plane
  directionalLight.shadow.camera.left = -150;
  directionalLight.shadow.camera.right = 150;
  directionalLight.shadow.camera.top = 150;
  directionalLight.shadow.camera.bottom = -150;
  scene.add(directionalLight);
}

// Create the ground plane
function createGround(scene, size) {
  const groundGeometry = new THREE.PlaneGeometry(size, size);
  const groundMaterial = new THREE.MeshLambertMaterial({
    color: 0x55aa55,
  }); // Greenish
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Return the ground object so it can be assigned to the global variable
  return ground;
}