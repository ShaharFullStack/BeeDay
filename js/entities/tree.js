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

  // Trunk
  const trunkGeometry = new THREE.CylinderGeometry(
    trunkRadius * 0.7,
    trunkRadius,
    trunkHeight,
    12
  );
  const trunkMaterial = new THREE.MeshLambertMaterial({
    color: 0x8b4513,
  }); // SaddleBrown
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  treeGroup.add(trunk);

  // Leaves (can be a sphere or a cone, let's use a sphere for simplicity)
  const leavesGeometry = new THREE.SphereGeometry(leavesRadius, 16, 12);
  const leavesMaterial = new THREE.MeshLambertMaterial({
    color: 0x228b22,
  }); // ForestGreen
  const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
  leaves.position.y =
    trunkHeight + leavesHeight * 0.4 - leavesRadius * 0.2; // Position leaves on top of trunk
  leaves.castShadow = true;
  treeGroup.add(leaves);

  treeGroup.userData = {
    trunkHeight: trunkHeight,
    leavesRadius: leavesRadius,
    trunk: trunk, // Store reference to trunk for hive placement
  };
  
  scene.add(treeGroup);
  return treeGroup;
}

// Create the initial set of trees, including the special hive tree
function createInitialTreesAndHive() {
  // Create the "largest" tree for the hive
  hiveTree = createTree(0, -10, 1.5, 12, 4, 3); // x, z, trunkRadius, trunkHeight, leavesRadius, leavesHeight
  trees.push(hiveTree);

  // Create some other random trees
  const numTrees = 15;
  for (let i = 0; i < numTrees; i++) {
    const x = (Math.random() - 0.5) * 150;
    const z = (Math.random() - 0.5) * 150;
    
    // Avoid placing trees too close to the hive tree or origin
    if (Math.sqrt(x * x + z * z) > 20) {
      const rTrunk = 0.5 + Math.random() * 0.8;
      const hTrunk = 4 + Math.random() * 5;
      const rLeaves = 2 + Math.random() * 2;
      const hLeaves = 1 + Math.random() * 1;
      trees.push(createTree(x, z, rTrunk, hTrunk, rLeaves, hLeaves));
    }
  }
  
  createHive(); // Hive creation depends on hiveTree
}