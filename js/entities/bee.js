// Bee entity creation and management

// Create the bee with its body and wings
function createBee() {
  try {
    bee = new THREE.Group();
    bee.position.set(0, 5, 0); // Start a bit higher
    
    // Low-poly bee body - use octahedron for faceted look
    const beeBodyGeometry = new THREE.OctahedronGeometry(0.3, 1);
    
    // Using MeshPhongMaterial which supports flatShading
    const beeBodyMaterial = new THREE.MeshPhongMaterial({
      color: 0xfdcb6e, // Golden yellow
      flatShading: true
    });
    
    const beeBody = new THREE.Mesh(beeBodyGeometry, beeBodyMaterial);
    beeBody.castShadow = true;
    
    // Add stripes to the bee body
    const stripeGeometry = new THREE.BoxGeometry(0.62, 0.1, 0.3);
    const stripeMaterial = new THREE.MeshLambertMaterial({
      color: 0x2d3436 // Dark gray/black
      // MeshLambertMaterial doesn't need flatShading
    });
    
    // Add multiple stripes
    const stripe1 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe1.position.y = 0.1;
    beeBody.add(stripe1);
    
    const stripe2 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe2.position.y = -0.1;
    beeBody.add(stripe2);
    
    bee.add(beeBody);
  
    // Create stylized low-poly wings
    beeWings = new THREE.Group();
    
    // Simplified wing geometry - just a triangle shape for low-poly look
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(-0.4, 0.1);
    wingShape.lineTo(-0.3, 0.3);
    wingShape.lineTo(0, 0.1);
    wingShape.lineTo(0, 0);
    
    const wingGeometry = new THREE.ShapeGeometry(wingShape);
    const wingMaterial = new THREE.MeshBasicMaterial({
      color: 0xdfe6e9,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
      // MeshBasicMaterial doesn't need flatShading
    });
    
    // Left wing
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.2, 0.2, 0);
    leftWing.rotation.z = Math.PI / 6;
    beeWings.add(leftWing);
    
    // Right wing - mirror of left wing
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.2, 0.2, 0);
    rightWing.rotation.y = Math.PI;
    rightWing.rotation.z = Math.PI / 6;
    beeWings.add(rightWing);
    
    bee.add(beeWings);
  
    // Add camera to bee
    camera.position.set(0, 4.25, 5.05);
    bee.add(camera);
    
    scene.add(bee);
    
    return bee; // Return the bee object
  } catch (error) {
    console.error("Error creating bee:", error);
    return null;
  }
}