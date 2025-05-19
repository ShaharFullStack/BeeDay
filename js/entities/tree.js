// Tree entity creation and management

// Create a single tree at the given position with specified parameters
function createTree(
  x,
  z,
  trunkRadius,
  trunkHeight,
  leavesRadius,
  leavesHeight
) {
  const treeGroup = new THREE.Group();
  treeGroup.position.set(x, 0, z);

  // Low-poly trunk with faceted segments
  const trunkGeometry = new THREE.CylinderGeometry(
    trunkRadius * 0.7,
    trunkRadius,
    trunkHeight +2,
    LOW_POLY_SEGMENTS,
    3,
    false
  );
  
  const trunkMaterial = new THREE.MeshLambertMaterial({
    color: TREE_TRUNK_COLOR,
    flatShading: true // For low-poly look
  });
  
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  treeGroup.add(trunk);

  // Low-poly leaves with random pastel colors
  // Use octahedron for low-poly look instead of sphere
  const leavesGeometry = new THREE.OctahedronGeometry(leavesRadius, 1);
  
  // Randomize vertices to make it more interesting - BufferGeometry version
  const positionAttribute = leavesGeometry.getAttribute('position');
  const offset = 0.2;
  
  for (let i = 0; i < positionAttribute.count; i++) {
    const randomX = (Math.random() * offset * 2) - offset;
    const randomY = (Math.random() * offset * 2) - offset;
    const randomZ = (Math.random() * offset * 2) - offset;
    
    positionAttribute.setX(i, positionAttribute.getX(i) + randomX);
    positionAttribute.setY(i, positionAttribute.getY(i) + randomY);
    positionAttribute.setZ(i, positionAttribute.getZ(i) + randomZ);
  }
  
  leavesGeometry.computeVertexNormals();
  
  // Randomly choose a pastel color for the leaves
  const randomLeafColorIndex = Math.floor(Math.random() * TREE_LEAVES_COLORS.length);
  const leavesMaterial = new THREE.MeshLambertMaterial({
    color: TREE_LEAVES_COLORS[randomLeafColorIndex],
    flatShading: true // For low-poly look
  });
  
  const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
  leaves.position.y = trunkHeight - leavesRadius * 0.2; // Position leaves on top of trunk
  leaves.castShadow = true;
  treeGroup.add(leaves);

  treeGroup.userData = {
    trunkHeight: trunkHeight,
    leavesRadius: leavesRadius,
    trunk: trunk, // Store reference to trunk for hive placement
    leavesColor: TREE_LEAVES_COLORS[randomLeafColorIndex] // Store color for reference
  };
  
  scene.add(treeGroup);
  return treeGroup;
}

// Create the initial set of trees, including the special hive tree
function createInitialTreesAndHive() {
  // Create the "largest" tree for the hive with cherry blossom colors
  hiveTree = createTree(0, -10, 1.5, 12, 4, 3); // x, z, trunkRadius, trunkHeight, leavesRadius, leavesHeight
  
  // Ensure hive tree has pink leaves
  hiveTree.children[1].material.color.setHex(0xff9ff3); // Pink cherry blossom color
  
  trees.push(hiveTree);

  // Create some other random trees
  const numTrees = 25; // More trees for a denser forest
  for (let i = 0; i < numTrees; i++) {
    const x = (Math.random() - 0.5) * 150;
    const z = (Math.random() - 0.5) * 150;
    
    // Avoid placing trees too close to the hive tree or origin
    if (Math.sqrt(x * x + z * z) > 20) {
      // More variation in tree sizes
      const rTrunk = 0.5 + Math.random() * 1.2;
      const hTrunk = 4 + Math.random() * 8;
      const rLeaves = 2 + Math.random() * 4;
      const hLeaves = 1 + Math.random() * 2;
      trees.push(createTree(x, z, rTrunk, hTrunk, rLeaves, hLeaves));
    }
  }
  
  createHive(); // Hive creation depends on hiveTree
}