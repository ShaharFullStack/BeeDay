// Bee entity creation and management

// Create the bee with its body and wings
function createBee() {
  bee = new THREE.Group();
  bee.position.set(0, 5, 0); // Start a bit higher
  
  // Bee body
  const beeBodyGeometry = new THREE.SphereGeometry(0.3, 16, 12);
  const beeBodyMaterial = new THREE.MeshLambertMaterial({
    color: 0xffd700,
  });
  const beeBody = new THREE.Mesh(beeBodyGeometry, beeBodyMaterial);
  beeBody.castShadow = true;
  bee.add(beeBody);

  // Create wings
  beeWings = new THREE.Group();
  const wingGeometry = new THREE.PlaneGeometry(0.4, 0.2);
  const wingMaterial = new THREE.MeshBasicMaterial({
    color: 0xadd8e6,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });
  
  // Left wing
  const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
  leftWing.position.set(-0.25, 0.1, -0.1);
  leftWing.rotation.y = Math.PI / 1.8;
  leftWing.rotation.z = Math.PI / 6;
  beeWings.add(leftWing);
  
  // Right wing
  const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
  rightWing.position.set(0.25, 0.1, -0.1);
  rightWing.rotation.y = -Math.PI / 1.8;
  rightWing.rotation.z = -Math.PI / 6;
  beeWings.add(rightWing);
  
  bee.add(beeWings);

  // Add camera to bee
  camera.position.set(0, 0.25, 0.05);
  bee.add(camera);
  
  scene.add(bee);
}