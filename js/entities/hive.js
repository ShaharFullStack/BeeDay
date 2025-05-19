// Beehive creation and management

// Create the beehive attached to the hive tree
function createHive() {
  if (!hiveTree) {
    console.error("Hive tree not defined before creating hive!");
    return;
  }

  // Create a more detailed beehive structure
  const hiveGroup = new THREE.Group();

  // Main hive body - using a modified cylinder for a more realistic beehive look
  const hiveBaseGeometry = new THREE.CylinderGeometry(
    1.2,
    1.5,
    2,
    16,
    3,
    false
  );
  const hiveMaterial = new THREE.MeshLambertMaterial({ color: 0xd2b48c }); // Tan color
  const hiveBase = new THREE.Mesh(hiveBaseGeometry, hiveMaterial);
  hiveBase.castShadow = true;
  hiveBase.receiveShadow = true;
  hiveGroup.add(hiveBase);

  // Top dome of the hive
  const hiveTopGeometry = new THREE.SphereGeometry(
    1.2,
    16,
    8,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  const hiveTop = new THREE.Mesh(hiveTopGeometry, hiveMaterial);
  hiveTop.position.y = 1;
  hiveTop.castShadow = true;
  hiveTop.receiveShadow = true;
  hiveGroup.add(hiveTop);

  // Add entrance hole
  const entranceGeometry = new THREE.CircleGeometry(0.3, 16);
  const entranceMaterial = new THREE.MeshBasicMaterial({
    color: 0x4d3900,
  }); // Dark brown
  const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
  entrance.position.set(0, 0, 1.51);
  entrance.rotation.y = Math.PI;
  hiveGroup.add(entrance);

  // Add some detail rings around the hive
  for (let i = 0; i < 3; i++) {
    const ringGeometry = new THREE.TorusGeometry(
      1.3 + i * 0.05,
      0.06,
      8,
      32
    );
    const ringMaterial = new THREE.MeshLambertMaterial({
      color: 0xc19a6b,
    }); // Slightly darker tan
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.y = -0.5 + i * 0.5;
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = true;
    hiveGroup.add(ring);
  }

  // Position hive on the hiveTree trunk (not on leaves)
  // Place it near the top of the trunk but below the leaves
  const trunkTopY = hiveTree.userData.trunkHeight * 0.8; // 80% up the trunk

  // Position the hive slightly off-center on a branch coming from the trunk
  const branchGeometry = new THREE.CylinderGeometry(0.3, 0.2, 2.5, 8);
  const branchMaterial = new THREE.MeshLambertMaterial({
    color: 0x8b4513,
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
}