// Beehive creation and management

// Create the beehive attached to the hive tree
function createHive() {
  try {
    if (!hiveTree) {
      console.error("Hive tree not defined before creating hive!");
      return;
    }
  
    // Create a more detailed beehive structure - low-poly style
    const hiveGroup = new THREE.Group();
  
    // Main hive body - low-poly cylinder
    const hiveBaseGeometry = new THREE.CylinderGeometry(
      1.2,
      1.5,
      2,
      LOW_POLY_SEGMENTS,
      2,
      false
    );
    
    // Using MeshPhongMaterial which supports flatShading
    const hiveMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xfdcb6e, // Yellow color
      flatShading: true
    });
    
    // Add some randomization for more organic feel using BufferGeometry methods
    const positionAttribute = hiveBaseGeometry.getAttribute('position');
    const vertexCount = positionAttribute.count;
    const skipTopBottom = Math.floor(vertexCount / 3); // Approximately skip the top and bottom vertices
    
    for (let i = skipTopBottom; i < vertexCount - skipTopBottom; i++) {
      const offset = 0.1;
      if (Math.random() > 0.5) { // Only modify some vertices for a more interesting look
        positionAttribute.setX(i, positionAttribute.getX(i) + ((Math.random() * offset * 2) - offset));
        positionAttribute.setZ(i, positionAttribute.getZ(i) + ((Math.random() * offset * 2) - offset));
      }
    }
    
    hiveBaseGeometry.computeVertexNormals();
    
    const hiveBase = new THREE.Mesh(hiveBaseGeometry, hiveMaterial);
    hiveBase.castShadow = true;
    hiveBase.receiveShadow = true;
    hiveGroup.add(hiveBase);
  
    // Top dome of the hive - low-poly cone
    const hiveTopGeometry = new THREE.ConeGeometry(
      1.2,
      1.2,
      LOW_POLY_SEGMENTS,
      1
    );
    const hiveTop = new THREE.Mesh(hiveTopGeometry, hiveMaterial);
    hiveTop.position.y = 1;
    hiveTop.castShadow = true;
    hiveTop.receiveShadow = true;
    hiveGroup.add(hiveTop);
  
    // Add entrance hole
    const entranceGeometry = new THREE.CircleGeometry(0.3, LOW_POLY_SEGMENTS);
    const entranceMaterial = new THREE.MeshBasicMaterial({
      color: 0x4d3900,
    }); // Dark brown
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(0, 0, 1.51);
    entrance.rotation.y = Math.PI;
    hiveGroup.add(entrance);
  
    // Add some honeycomb pattern detail on the hive
    const honeycombPattern = createHoneycombPattern();
    honeycombPattern.position.set(0, 0, 0);
    hiveGroup.add(honeycombPattern);
  
    // Position hive on the hiveTree trunk (not on leaves)
    // Place it near the top of the trunk but below the leaves
    const trunkTopY = hiveTree.userData.trunkHeight * 0.8; // 80% up the trunk
  
    // Position the hive slightly off-center on a branch coming from the trunk
    const branchGeometry = new THREE.CylinderGeometry(0.3, 0.2, 2.5, LOW_POLY_SEGMENTS);
    
    // Using MeshPhongMaterial which supports flatShading
    const branchMaterial = new THREE.MeshPhongMaterial({
      color: TREE_TRUNK_COLOR,
      flatShading: true
    });
    
    const branch = new THREE.Mesh(branchGeometry, branchMaterial);
    branch.position.set(
      hiveTree.position.x,
      trunkTopY,
      hiveTree.position.z
    );
    branch.rotation.z = Math.PI / 4; // Angle the branch upward and outward
    branch.castShadow = true;
    scene.add(branch);
  
    // Position the hive at the end of the branch
    hiveGroup.position.set(
      hiveTree.position.x + 1.8, // Offset from tree center
      trunkTopY + 1.2, // Height on the tree trunk
      hiveTree.position.z
    );
  
    hive = hiveGroup; // Assign the hive group to the global hive variable
    scene.add(hiveGroup);
  } catch (error) {
    console.error("Error creating hive:", error);
  }
}

// Create honeycomb pattern for hive
function createHoneycombPattern() {
  try {
    const patternGroup = new THREE.Group();
    
    // Create a few hexagons on the hive surface
    const numHexagons = 12;
    const hexSize = 0.2;
    
    for (let i = 0; i < numHexagons; i++) {
      const hexGeometry = new THREE.CircleGeometry(hexSize, 6);
      const hexMaterial = new THREE.MeshBasicMaterial({
        color: 0xd0a000, // Darker yellow
        transparent: true,
        opacity: 0.8,
        wireframe: true
      });
      
      const hex = new THREE.Mesh(hexGeometry, hexMaterial);
      
      // Position hexagons randomly around the hive
      const angle = Math.random() * Math.PI * 2;
      const radiusVariation = 1.0 + (Math.random() * 0.3); 
      
      hex.position.x = Math.sin(angle) * radiusVariation;
      hex.position.z = Math.cos(angle) * radiusVariation;
      hex.position.y = -0.8 + Math.random() * 1.6; // Along the height of the hive
      
      // Rotate to face outward
      hex.rotation.y = angle;
      hex.rotation.x = Math.PI / 2;
      
      patternGroup.add(hex);
    }
    
    return patternGroup;
  } catch (error) {
    console.error("Error creating honeycomb pattern:", error);
    return new THREE.Group(); // Return empty group if error occurs
  }
}