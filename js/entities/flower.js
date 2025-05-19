// Flower entity creation and management

// Create a reusable petal shape geometry for all flowers
let sharedPetalGeometry;
function createPetalShape() {
  const petalShape = new THREE.Shape();
  const width = 0.2;
  const height = 0.5;
  petalShape.moveTo(0, 0);
  petalShape.bezierCurveTo(
    width / 2,
    height / 3,
    width / 2,
    (2 * height) / 3,
    0,
    height
  );
  petalShape.bezierCurveTo(
    -width / 2,
    (2 * height) / 3,
    -width / 2,
    height / 3,
    0,
    0
  );
  return new THREE.ShapeGeometry(petalShape);
}

// Create a single flower at the given position
function createFlower(x, z, cellKey) {
  // Initialize shared petal geometry if needed
  if (!sharedPetalGeometry) {
    sharedPetalGeometry = createPetalShape();
  }

  const flowerGroup = new THREE.Group();
  flowerGroup.position.set(x, 0, z);
  
  // Create stem
  const stemHeight = 0.8 + Math.random() * 0.4; // Slightly shorter stems
  const stemGeometry = new THREE.CylinderGeometry(0.04, 0.06, stemHeight, 8);
  const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x007700 });
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.y = stemHeight / 2;
  stem.castShadow = true;
  flowerGroup.add(stem);

  // Create petals
  const petalsGroup = new THREE.Group();
  petalsGroup.position.y = stemHeight;
  flowerGroup.add(petalsGroup);
  
  // Random color for petals
  const petalColorHex = FLOWER_PETAL_COLORS[
    Math.floor(Math.random() * FLOWER_PETAL_COLORS.length)
  ];
  const flowerPetalMaterial = new THREE.MeshLambertMaterial({
    color: petalColorHex,
    side: THREE.DoubleSide,
  });
  
  // Add petals in a circle
  const numPetals = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numPetals; i++) {
    const petal = new THREE.Mesh(sharedPetalGeometry, flowerPetalMaterial);
    const angle = (i / numPetals) * Math.PI * 2;
    petal.position.x = Math.sin(angle) * 0.25;
    petal.position.z = Math.cos(angle) * 0.25; // Smaller petal spread
    petal.rotation.y = -angle + Math.PI / 2;
    petal.rotation.x = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
    petal.castShadow = true;
    petalsGroup.add(petal);
  }

  // Create nectar center
  const nectarGeometry = new THREE.SphereGeometry(0.1, 10, 6);
  const nectarMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
  const nectarCenter = new THREE.Mesh(nectarGeometry, nectarMaterial);
  nectarCenter.position.y = stemHeight + 0.03;
  nectarCenter.name = "nectarCenter";
  nectarCenter.castShadow = true;
  flowerGroup.add(nectarCenter);

  // Store metadata for the flower
  flowerGroup.userData = {
    hasNectar: true,
    originalPetalColorHex: petalColorHex,
    petalMaterial: flowerPetalMaterial,
    nectarCenterMesh: nectarCenter,
    originalNectarScale: nectarCenter.scale.clone(),
    petalsGroup: petalsGroup,
    cellKey: cellKey, // Store which cell this flower belongs to
  };
  
  scene.add(flowerGroup);
  return flowerGroup;
}

// Manage the dynamic flowers based on bee's position
function updateBeeCellAndManageFlowers(forceUpdate = false) {
  const beeCellX = Math.floor(bee.position.x / CELL_SIZE);
  const beeCellZ = Math.floor(bee.position.z / CELL_SIZE);

  if (forceUpdate || beeCellX !== lastBeeCellX || beeCellZ !== lastBeeCellZ) {
    lastBeeCellX = beeCellX;
    lastBeeCellZ = beeCellZ;
    manageFlowers(beeCellX, beeCellZ);
  }
}

function manageFlowers(currentCellX, currentCellZ) {
  const newPopulatedCells = new Set();
  
  // Populate new cells
  for (let i = -VIEW_RADIUS_CELLS; i <= VIEW_RADIUS_CELLS; i++) {
    for (let j = -VIEW_RADIUS_CELLS; j <= VIEW_RADIUS_CELLS; j++) {
      const cellX = currentCellX + i;
      const cellZ = currentCellZ + j;
      const cellKey = `${cellX},${cellZ}`;
      newPopulatedCells.add(cellKey);

      if (!populatedCells.has(cellKey) && flowers.length < MAX_FLOWERS) {
        for (let k = 0; k < FLOWER_DENSITY_PER_CELL; k++) {
          if (flowers.length >= MAX_FLOWERS) break;
          const flowerX = (cellX + Math.random()) * CELL_SIZE;
          const flowerZ = (cellZ + Math.random()) * CELL_SIZE;

          // Simple check to avoid spawning flowers on the hive tree base
          if (
            hiveTree &&
            Math.abs(flowerX - hiveTree.position.x) < 5 &&
            Math.abs(flowerZ - hiveTree.position.z) < 5
          ) {
            continue;
          }
          
          flowers.push(createFlower(flowerX, flowerZ, cellKey));
        }
      }
    }
  }
  
  populatedCells = newPopulatedCells; // Update the set of active cells

  // Remove far flowers
  const flowersToRemove = [];
  for (let i = flowers.length - 1; i >= 0; i--) {
    const flower = flowers[i];
    if (!populatedCells.has(flower.userData.cellKey)) {
      flowersToRemove.push(i);
      scene.remove(flower);
    }
  }
  
  for (const index of flowersToRemove.sort((a, b) => b - a)) {
    // Sort to remove from end
    flowers.splice(index, 1);
  }
}