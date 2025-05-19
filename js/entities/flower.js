// Flower entity creation and management

// Create a reusable petal shape geometry for all flowers
let sharedPetalGeometry;
function createPetalShape() {
  // Create a simplified low-poly petal shape
  const petalShape = new THREE.Shape();
  const width = 0.2;
  const height = 0.5;
  
  // Simplify the shape for low-poly look - use fewer points
  petalShape.moveTo(0, 0);
  petalShape.lineTo(width / 2, height / 2);
  petalShape.lineTo(0, height);
  petalShape.lineTo(-width / 2, height / 2);
  petalShape.lineTo(0, 0);
  
  return new THREE.ShapeGeometry(petalShape);
}

// Create a single flower at the given position
function createFlower(x, z, cellKey) {
  try {
    // Initialize shared petal geometry if needed
    if (!sharedPetalGeometry) {
      sharedPetalGeometry = createPetalShape();
    }
  
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(x, 0, z);
    
    // Create stem - thinner and taller for aesthetic
    const stemHeight = 1.0 + Math.random() * 0.6;
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.05, stemHeight, LOW_POLY_SEGMENTS);
    
    // Using MeshPhongMaterial which supports flatShading
    const stemMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2ecc71,
      flatShading: true
    });
    
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = stemHeight / 2;
    stem.castShadow = true;
    flowerGroup.add(stem);
  
    // Create petals - more stylized for low-poly look
    const petalsGroup = new THREE.Group();
    petalsGroup.position.y = stemHeight;
    flowerGroup.add(petalsGroup);
    
    // Random pastel color from our new palette
    const petalColorHex = FLOWER_PETAL_COLORS[
      Math.floor(Math.random() * FLOWER_PETAL_COLORS.length)
    ];
    
    // Using MeshPhongMaterial which supports flatShading
    const flowerPetalMaterial = new THREE.MeshPhongMaterial({
      color: petalColorHex,
      side: THREE.DoubleSide,
      flatShading: true
    });
    
    // Add petals in a circle - fewer for better performance
    const numPetals = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numPetals; i++) {
      const petal = new THREE.Mesh(sharedPetalGeometry, flowerPetalMaterial);
      const angle = (i / numPetals) * Math.PI * 2;
      petal.position.x = Math.sin(angle) * 0.15;
      petal.position.z = Math.cos(angle) * 0.15;
      petal.rotation.y = -angle + Math.PI / 2;
      petal.rotation.x = Math.PI / 3; // More upright petals
      petal.castShadow = true;
      petalsGroup.add(petal);
    }
  
    // Create nectar center - brighter yellow
    const nectarGeometry = new THREE.TetrahedronGeometry(0.08, 0); // Low-poly center
    const nectarMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xfdcb6e
      // MeshLambertMaterial doesn't need flatShading
    });
    
    const nectarCenter = new THREE.Mesh(nectarGeometry, nectarMaterial);
    nectarCenter.position.y = stemHeight + 0.05;
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
  } catch (error) {
    console.error("Error creating flower:", error);
    return null;
  }
}

// Manage the dynamic flowers based on bee's position
function updateBeeCellAndManageFlowers(forceUpdate = false) {
  try {
    if (!bee || !bee.position) return;
    
    const beeCellX = Math.floor(bee.position.x / CELL_SIZE);
    const beeCellZ = Math.floor(bee.position.z / CELL_SIZE);
  
    if (forceUpdate || beeCellX !== lastBeeCellX || beeCellZ !== lastBeeCellZ) {
      lastBeeCellX = beeCellX;
      lastBeeCellZ = beeCellZ;
      manageFlowers(beeCellX, beeCellZ);
    }
  } catch (error) {
    console.error("Error updating flowers:", error);
  }
}

function manageFlowers(currentCellX, currentCellZ) {
  try {
    const newPopulatedCells = new Set();
    
    // Populate new cells
    for (let i = -VIEW_RADIUS_CELLS; i <= VIEW_RADIUS_CELLS; i++) {
      for (let j = -VIEW_RADIUS_CELLS; j <= VIEW_RADIUS_CELLS; j++) {
        const cellX = currentCellX + i;
        const cellZ = currentCellZ + j;
        const cellKey = `${cellX},${cellZ}`;
        newPopulatedCells.add(cellKey);
  
        if (!populatedCells.has(cellKey) && flowers.length < MAX_FLOWERS) {
          // Increase flower density for more vibrant fields
          for (let k = 0; k < FLOWER_DENSITY_PER_CELL * 2; k++) {
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
            
            const flower = createFlower(flowerX, flowerZ, cellKey);
            if (flower) {
              flowers.push(flower);
            }
          }
        }
      }
    }
    
    populatedCells = newPopulatedCells; // Update the set of active cells
  
    // Remove far flowers
    const flowersToRemove = [];
    for (let i = flowers.length - 1; i >= 0; i--) {
      const flower = flowers[i];
      if (flower && flower.userData && !populatedCells.has(flower.userData.cellKey)) {
        flowersToRemove.push(i);
        scene.remove(flower);
      }
    }
    
    for (const index of flowersToRemove.sort((a, b) => b - a)) {
      // Sort to remove from end
      flowers.splice(index, 1);
    }
  } catch (error) {
    console.error("Error managing flowers:", error);
  }
}