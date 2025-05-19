// Tree creation function

// Create a tree with a low-poly style
function createTree(x, z, isHiveTree = false) {
  try {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);
    
    // Random trunk height for variety
    const trunkHeight = 5 + Math.random() * 3;
    
    // Store the trunk height for later use (especially for hive placement)
    treeGroup.userData.trunkHeight = trunkHeight;
    
    // Create tree trunk - tapered cylinder
    const trunkGeometry = new THREE.CylinderGeometry(
      0.3, // Top radius
      0.6, // Bottom radius
      trunkHeight,
      LOW_POLY_SEGMENTS,
      2, // Height segments
      true // Open-ended
    );
    
    // Using MeshPhongMaterial which supports flatShading
    const trunkMaterial = new THREE.MeshPhongMaterial({
      color: TREE_TRUNK_COLOR,
      flatShading: true
    });
    
    // Add some randomization to the trunk vertices for organic feel
    const positionAttribute = trunkGeometry.getAttribute('position');
    const vertexCount = positionAttribute.count;
    
    for (let i = 0; i < vertexCount; i++) {
      const offset = 0.1;
      if (Math.random() > 0.7) { // Only modify some vertices
        positionAttribute.setX(i, positionAttribute.getX(i) + ((Math.random() * offset * 2) - offset));
        positionAttribute.setZ(i, positionAttribute.getZ(i) + ((Math.random() * offset * 2) - offset));
      }
    }
    
    trunkGeometry.computeVertexNormals();
    
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);
    
    // Choose a color for the leaves - cherry blossom or green based on random chance
    // For the hive tree, use cherry blossoms to make it distinctive
    const leavesMaterial = new THREE.MeshPhongMaterial({
      color: isHiveTree ? 
        TREE_LEAVES_COLORS[0] : // Always pink for hive tree
        TREE_LEAVES_COLORS[Math.floor(Math.random() * TREE_LEAVES_COLORS.length)],
      flatShading: true
    });
    
    // Create cluster of leaf shapes
    const leafCount = 3 + Math.floor(Math.random() * 3); // 3-5 leaf clusters
    
    for (let i = 0; i < leafCount; i++) {
      // Create leaf cluster as a low-poly shape
      const leafSize = 1.5 + Math.random() * 0.5;
      
      // Use different primitive shapes for variation
      let leafGeometry;
      const shapeType = Math.floor(Math.random() * 3);
      
      switch (shapeType) {
        case 0:
          leafGeometry = new THREE.IcosahedronGeometry(leafSize, 0); // Low detail
          break;
        case 1:
          leafGeometry = new THREE.DodecahedronGeometry(leafSize, 0); // Low detail
          break;
        default:
          leafGeometry = new THREE.OctahedronGeometry(leafSize, 0); // Low detail
      }
      
      const leafCluster = new THREE.Mesh(leafGeometry, leavesMaterial);
      
      // Position leaf clusters around the top of the trunk
      const angle = (i / leafCount) * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.3;
      
      leafCluster.position.set(
        Math.sin(angle) * radius,
        trunkHeight + (leafSize * 0.5) - 0.5,
        Math.cos(angle) * radius
      );
      
      // Add some rotation for variation
      leafCluster.rotation.x = Math.random() * 0.5;
      leafCluster.rotation.y = Math.random() * 0.5;
      leafCluster.rotation.z = Math.random() * 0.5;
      
      leafCluster.castShadow = true;
      treeGroup.add(leafCluster);
    }
    
    // Add to scene and global trees array
    scene.add(treeGroup);
    trees.push(treeGroup);
    
    return treeGroup;
  } catch (error) {
    console.error("Error creating tree:", error);
    return null;
  }
}
