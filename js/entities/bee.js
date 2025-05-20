function createBee() {
  try {
    bee = new THREE.Group();
    bee.position.set(0, 3, 0); // Start a bit higher

    // Low-poly bee body - use octahedron for faceted look
    const beeBodyGeometry = new THREE.OctahedronGeometry(0.3, 1);

    // Using MeshPhongMaterial which supports flatShading
    const beeBodyMaterial = new THREE.MeshPhongMaterial({
      color: 0xfdcb6e, // Golden yellow
      flatShading: true
    });

    const beeBody = new THREE.Mesh(beeBodyGeometry, beeBodyMaterial);
    beeBody.castShadow = true;

    // Add stripes to the bee body (keeping existing stripes)
    const stripeGeometry = new THREE.BoxGeometry(beeBodyGeometry.parameters.radius, 0.2, beeBodyGeometry.parameters.radius);
    const stripeMaterial = new THREE.MeshLambertMaterial({
      color: 0x2d3436 // Dark gray/black
      // MeshLambertMaterial doesn't need flatShading
    });

    // // Add multiple stripes
    // const stripe1 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    // stripe1.position.y = 0.1;
    // stripe1.rotation.z = Math.PI / 2; // Rotate for a different angle
    // beeBody.add(stripe1);

    // const stripe2 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    // stripe2.position.y = -0.1;
    // stripe2.rotation.z = Math.PI / 4; // Rotate for a different angle
    // beeBody.add(stripe2);

    bee.add(beeBody);

    // --- Add the three dark rings --- //
    const ringMaterial = new THREE.MeshLambertMaterial({
      color: 0x2d3436, // Dark gray/black, matching stripes
      side: THREE.DoubleSide // Render both sides
    });

    // Ring 1
    const ringGeometry1 = new THREE.TorusGeometry(0.1, 0.02, 8, 32);
    const ring1 = new THREE.Mesh(ringGeometry1, ringMaterial);
    ring1.rotation.x = Math.PI * 2; // Rotate to lie flat
    ring1.position.y = 0.25; // Position along the body
    beeBody.add(ring1);

    // Ring 2
    const ringGeometry2 = new THREE.TorusGeometry(0.1, 0.1, 8, 32);
    const ring2 = new THREE.Mesh(ringGeometry2, ringMaterial);
    ring2.rotation.x = Math.PI * 2; // Rotate to lie flat
    ring2.position.y = 0.2; // Position along the body
    beeBody.add(ring2);

    // Ring 3
    const ringGeometry3 = new THREE.TorusGeometry(0.07, 0.122, 8, 32);
    const ring3 = new THREE.Mesh(ringGeometry3, ringMaterial);
    ring3.rotation.x = Math.PI * 2; // Rotate to lie flat
    ring3.position.z = 0.15; // Position along the body
    beeBody.add(ring3);

    // Ring 4
    const ringGeometry4 = new THREE.TorusGeometry(0.05, 0.022, 8, 32);
    const ring4 = new THREE.Mesh(ringGeometry4, ringMaterial);
    ring4.rotation.x = Math.PI / 2; // Rotate to lie flat
    ring4.position.z = -0.3; // Position along the body
    beeBody.add(ring4);
    // --- End of adding rings --- //

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
    // Assuming 'camera' is defined elsewhere and is a THREE.Camera instance
    if (camera) {
      camera.position.set(0, 1.25, 2.05);
      bee.add(camera);
    } else {
      console.warn("Camera object not found. Cannot attach camera to bee.");
    }

    // Assuming 'scene' is defined elsewhere and is a THREE.Scene instance
    if (scene) {
      scene.add(bee);
    } else {
      console.warn("Scene object not found. Cannot add bee to scene.");
    }
    
    bee.scale.set(0.5, 0.5, 0.5); // Scale down to half size
    return bee; // Return the bee object
  } catch (error) {
    console.error("Error creating bee:", error);
    return null;
  }
}