// Flower entity creation and management

// Define shared geometries for petals and leaves
let sharedPetalGeometry;
let sharedLeafGeometry;

// Constants that might be defined elsewhere in your project
// Adjust these to match your actual values or import them from your config
const LOW_POLY_SEGMENTS = 5; // Segments for low-poly geometries
const FLOWER_PETAL_COLORS = [
  0xe84393, // Pink
  0xfd79a8, // Light pink
  0xffeaa7, // Light yellow
  0x55efc4, // Mint
  0x74b9ff, // Light blue
  0xa29bfe, // Lavender
  0xdfe6e9  // Light gray
];
const CELL_SIZE = 10;
const VIEW_RADIUS_CELLS = 3;
const FLOWER_DENSITY_PER_CELL = 3;
const MAX_FLOWERS = 100;

// Global variables used in this module
let flowers = [];
let populatedCells = new Set();
let lastBeeCellX = 0;
let lastBeeCellZ = 0;
let bee = null;
let hiveTree = null;

// Create a more detailed petal shape with extrusion for thickness
function createPetalShape() {
  const petalShape = new THREE.Shape();
  const width = 0.2;
  const height = 0.5;
  
  // Define a more organic, curved petal shape
  petalShape.moveTo(0, 0);
  petalShape.lineTo(width / 3, height / 3);
  petalShape.lineTo(width / 2, 2 * height / 3);
  petalShape.lineTo(width / 3, height);
  petalShape.lineTo(0, height);
  petalShape.lineTo(-width / 3, height);
  petalShape.lineTo(-width / 2, 2 * height / 3);
  petalShape.lineTo(-width / 3, height / 3);
  petalShape.lineTo(0, 0);
  
  const extrudeSettings = {
    steps: 1,
    depth: 0.02,
    bevelEnabled: false
  };
  
  return new THREE.ExtrudeGeometry(petalShape, extrudeSettings);
}

// Create a leaf shape with extrusion
function createLeafShape() {
  const leafShape = new THREE.Shape();
  const width = 0.2;
  const height = 0.4;
  
  leafShape.moveTo(0, 0);
  leafShape.lineTo(width / 2, height / 2);
  leafShape.lineTo(0, height);
  leafShape.lineTo(-width / 2, height / 2);
  leafShape.lineTo(0, 0);
  
  const extrudeSettings = {
    steps: 1,
    depth: 0.01,
    bevelEnabled: false
  };
  
  return new THREE.ExtrudeGeometry(leafShape, extrudeSettings);
}

// Create a single flower at the given position
function createFlower(x, z, cellKey) {
  try {
    // Initialize shared geometries if needed
    if (!sharedPetalGeometry) {
      sharedPetalGeometry = createPetalShape();
      sharedLeafGeometry = createLeafShape();
    }
  
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(x, 0, z);
    
    // Create stem
    const stemHeight = 1.0 + Math.random() * 0.6;
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.03, stemHeight, LOW_POLY_SEGMENTS);
    const stemMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2ecc71,
      flatShading: true
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = stemHeight / 2;
    stem.castShadow = true;
    flowerGroup.add(stem);
  
    // Random pastel color for petals
    const petalColorHex = FLOWER_PETAL_COLORS[
      Math.floor(Math.random() * FLOWER_PETAL_COLORS.length)
    ];
    const flowerPetalMaterial = new THREE.MeshPhongMaterial({
      color: petalColorHex,
      side: THREE.DoubleSide,
      flatShading: true
    });
    
    // Create outer petals
    const outerPetalsGroup = new THREE.Group();
    outerPetalsGroup.position.y = stemHeight;
    const numPetals = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numPetals; i++) {
      const petal = new THREE.Mesh(sharedPetalGeometry, flowerPetalMaterial);
      const angle = (i / numPetals) * Math.PI * 2;
      petal.position.x = Math.sin(angle) * 0.2;
      petal.position.z = Math.cos(angle) * 0.2;
      petal.rotation.y = -angle + Math.PI * 2;
      petal.rotation.x = Math.PI * 2;
      petal.scale.set(1 + Math.random() * 0.2 - 0.1, 1 + Math.random() * 0.2 - 0.1, 1);
      petal.castShadow = true;
      outerPetalsGroup.add(petal);
    }
    flowerGroup.add(outerPetalsGroup);
    
    // Create inner petals for a fuller look
    const innerPetalsGroup = new THREE.Group();
    innerPetalsGroup.position.y = stemHeight + 0.05;
    for (let i = 0; i < numPetals; i++) {
      const petal = new THREE.Mesh(sharedPetalGeometry, flowerPetalMaterial);
      const angle = (i / numPetals) * Math.PI * 2 + Math.PI / numPetals;
      petal.position.x = Math.sin(angle) * 0.15;
      petal.position.z = Math.cos(angle) * 0.15;
      petal.rotation.y = -angle + Math.PI / 2;
      petal.rotation.x = Math.PI * 2;
      petal.scale.set(0.8 + Math.random() * 0.2 - 0.1, 0.8 + Math.random() * 0.2 - 0.1, 1);
      petal.castShadow = true;
      innerPetalsGroup.add(petal);
    }
    flowerGroup.add(innerPetalsGroup);
  
    // Create nectar center with improved geometry and emissive material
    const nectarGeometry = new THREE.IcosahedronGeometry(0.08, 0);
    const nectarMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xfdcb6e,
      emissive: 0xffd700,
      emissiveIntensity: 0.5
    });
    const nectarCenter = new THREE.Mesh(nectarGeometry, nectarMaterial);
    nectarCenter.position.y = stemHeight + 0.1;
    nectarCenter.name = "nectarCenter";
    nectarCenter.castShadow = true;
    flowerGroup.add(nectarCenter);
  
    // Add leaves to the stem
    const leafMaterial = new THREE.MeshPhongMaterial({
      color: 0x2ecc71,
      side: THREE.DoubleSide,
      flatShading: true
    });
    const numLeaves = Math.floor(Math.random() * 2) + 1; // 1 or 2 leaves
    for (let i = 0; i < numLeaves; i++) {
      const leaf = new THREE.Mesh(sharedLeafGeometry, leafMaterial);
      const heightFraction = 0.3 + Math.random() * 0.4;
      leaf.position.y = stemHeight * heightFraction;
      leaf.position.x = (Math.random() - 0.5) * 0.2;
      leaf.position.z = (Math.random() - 0.5) * 0.2;
      leaf.rotation.y = Math.random() * Math.PI * 2;
      leaf.castShadow = true;
      flowerGroup.add(leaf);
    }
  
    // Store metadata for the flower
    flowerGroup.userData = {
      hasNectar: true,
      originalPetalColorHex: petalColorHex,
      petalMaterial: flowerPetalMaterial,
      nectarCenterMesh: nectarCenter,
      originalNectarScale: nectarCenter.scale.clone(),
      petalsGroup: outerPetalsGroup, // Storing outer petals group for compatibility
      cellKey: cellKey
    };
    
    // Add gentle animation
    flowerGroup.userData.animateFlower = function(time) {
      // Gentle swaying motion
      const swayAmount = 0.01;
      const swaySpeed = 0.5;
      flowerGroup.rotation.x = Math.sin(time * swaySpeed) * swayAmount;
      flowerGroup.rotation.z = Math.cos(time * swaySpeed * 0.7) * swayAmount;
    };
    
    scene.add(flowerGroup);
    flowers.push(flowerGroup);
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
          for (let k = 0; k < FLOWER_DENSITY_PER_CELL; k++) {
            if (flowers.length >= MAX_FLOWERS) break;
            const flowerX = (cellX + Math.random()) * CELL_SIZE;
            const flowerZ = (cellZ + Math.random()) * CELL_SIZE;
  
            if (
              hiveTree &&
              Math.abs(flowerX - hiveTree.position.x) < 5 &&
              Math.abs(flowerZ - hiveTree.position.z) < 5
            ) {
              continue;
            }
            
            const flower = createFlower(flowerX, flowerZ, cellKey);
            if (flower) {
              // Add animation update in your main animation loop:
              // const time = Date.now() * 0.001;
              // flower.userData.animateFlower(time);
            }
          }
        }
      }
    }
    
    populatedCells = newPopulatedCells;
  
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
      flowers.splice(index, 1);
    }
  } catch (error) {
    console.error("Error managing flowers:", error);
  }
}

// Updates all flowers in the animation loop
function updateFlowers(time) {
  for (const flower of flowers) {
    if (flower && flower.userData && flower.userData.animateFlower) {
      flower.userData.animateFlower(time);
    }
  }
}

// Export functions to be used in your main file
export {
  createFlower,
  updateBeeCellAndManageFlowers,
  manageFlowers,
  updateFlowers,
  flowers
};