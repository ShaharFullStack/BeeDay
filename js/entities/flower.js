// Assume these are defined elsewhere in your game code:
// const THREE = require('three'); // Or however you import Three.js
// const scene = new THREE.Scene();
// let flowers = [];
// const LOW_POLY_SEGMENTS = 5; // Example value
// const FLOWER_PETAL_COLORS_TYPE_1 = [0xe84393, 0xfd79a8, 0xffeaa7, 0x55efc4, 0x74b9ff, 0xa29bfe, 0xdfe6e9];
// const CELL_SIZE = 10; // Example
// const VIEW_RADIUS_CELLS = 2; // Example
// const MAX_FLOWERS = 100; // Example
// const FLOWER_DENSITY_PER_CELL = 2; // Example
// let populatedCells = new Set();
// let lastBeeCellX, lastBeeCellZ;
// let bee = { position: new THREE.Vector3() }; // Example bee object
// let hiveTree = { position: new THREE.Vector3(0,0,0) }; // Example hiveTree object


// --- Start of your provided and modified code ---

// Flower entity creation and management

// Define shared geometries for petals and leaves for different flower types
let sharedPetalGeometryType1;
let sharedLeafGeometryType1;
let sharedPetalGeometryType2;
let sharedLeafGeometryType2; // Can be the same as Type1 or different

// Define color palettes for different flower types
const FLOWER_PETAL_COLORS_TYPE_1 = [
    0xe84393, // Pink
    0xfd79a8, // Light pink
    0xffeaa7, // Light yellow
    0x55efc4, // Mint
    0x74b9ff, // Light blue
    0xa29bfe, // Lavender
    0xdfe6e9  // Light gray
];

const FLOWER_PETAL_COLORS_TYPE_2 = [
    0xff6b6b, // Red
    0xfeca57, // Orange
    0x48dbfb, // Bright Blue
    0x1dd1a1, // Teal
    0xff9ff3  // Bright Pink
];


// Create a more detailed petal shape with extrusion for thickness (TYPE 1)
function createPetalShapeType1() {
  const petalShape = new THREE.Shape();
  const width = 0.2;
  const height = 0.5;
  
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

// Create a leaf shape with extrusion (TYPE 1 - can be reused or made specific)
function createLeafShapeType1() {
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

// Create a new petal shape for TYPE 2 (e.g., more rounded or simpler)
function createPetalShapeType2() {
    const petalShape = new THREE.Shape();
    const width = 0.25; // Slightly wider
    const height = 0.4; // Slightly shorter
    
    petalShape.moveTo(0, 0);
    petalShape.absellipse(0, height * 0.5, width / 2, height / 2, 0, Math.PI * 2, false); // Simple ellipse for a basic petal

    const extrudeSettings = {
        steps: 1,
        depth: 0.02,
        bevelEnabled: false
    };
    return new THREE.ExtrudeGeometry(petalShape, extrudeSettings);
}

// Optionally, create a different leaf shape for Type 2, or reuse Type 1's
// For simplicity, let's reuse createLeafShapeType1 for sharedLeafGeometryType2
// function createLeafShapeType2() { ... }


// Create a flower at the given position, with a specified type
function createFlower(x, z, cellKey, flowerType = 'type1') { // Default to type1 if not specified
  try {
    let currentPetalGeometry, currentLeafGeometry, currentPetalColors;
    let stemMaterialColor = 0x2ecc71; // Default stem color

    if (flowerType === 'type1') {
        if (!sharedPetalGeometryType1) {
            sharedPetalGeometryType1 = createPetalShapeType1();
            sharedLeafGeometryType1 = createLeafShapeType1();
        }
        currentPetalGeometry = sharedPetalGeometryType1;
        currentLeafGeometry = sharedLeafGeometryType1;
        currentPetalColors = FLOWER_PETAL_COLORS_TYPE_1;
    } else if (flowerType === 'type2') {
        if (!sharedPetalGeometryType2) {
            sharedPetalGeometryType2 = createPetalShapeType2();
            // For Type 2, we can reuse Leaf Shape Type 1 or define a new one
            sharedLeafGeometryType2 = createLeafShapeType1(); // Reusing for now
        }
        currentPetalGeometry = sharedPetalGeometryType2;
        currentLeafGeometry = sharedLeafGeometryType2;
        currentPetalColors = FLOWER_PETAL_COLORS_TYPE_2;
        stemMaterialColor = 0x27ae60; // Slightly different stem for type 2
    } else {
        console.warn("Unknown flower type:", flowerType);
        return null;
    }
  
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(x, 0, z);
    
    // Create stem
    const stemHeight = 0.8 + Math.random() * 0.8; // Adjusted height range
    const stemGeometry = new THREE.CylinderGeometry(0.025, 0.035, stemHeight, LOW_POLY_SEGMENTS);
    const stemMaterial = new THREE.MeshPhongMaterial({ 
      color: stemMaterialColor,
      flatShading: true
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = stemHeight / 2;
    stem.castShadow = true;
    flowerGroup.add(stem);
  
    const petalColorHex = currentPetalColors[Math.floor(Math.random() * currentPetalColors.length)];
    const flowerPetalMaterial = new THREE.MeshPhongMaterial({
      color: petalColorHex,
      side: THREE.DoubleSide,
      flatShading: true
    });
    
    // Create Petals based on type
    if (flowerType === 'type1') {
        // --- Type 1 Petal Structure (Outer and Inner) ---
        const outerPetalsGroup = new THREE.Group();
        outerPetalsGroup.position.y = stemHeight;
        const numPetals = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numPetals; i++) {
            const petal = new THREE.Mesh(currentPetalGeometry, flowerPetalMaterial);
            const angle = (i / numPetals) * Math.PI * 2;
            petal.position.x = Math.sin(angle) * 0.2;
            petal.position.z = Math.cos(angle) * 0.2;
            petal.rotation.y = -angle; // Adjusted for correct orientation
            petal.rotation.x = Math.PI / 6 + (Math.random() * 0.2 - 0.1); // Tilt petals up a bit
            petal.scale.set(1 + Math.random() * 0.2 - 0.1, 1 + Math.random() * 0.2 - 0.1, 1);
            petal.castShadow = true;
            outerPetalsGroup.add(petal);
        }
        flowerGroup.add(outerPetalsGroup);
        
        const innerPetalsGroup = new THREE.Group();
        innerPetalsGroup.position.y = stemHeight + 0.03; // Slightly above outer
        for (let i = 0; i < numPetals -1; i++) { // Often one less inner petal
            const petal = new THREE.Mesh(currentPetalGeometry, flowerPetalMaterial);
            const angle = (i / (numPetals-1)) * Math.PI * 2 + Math.PI / (numPetals-1); // Offset
            petal.position.x = Math.sin(angle) * 0.12; // Smaller radius
            petal.position.z = Math.cos(angle) * 0.12;
            petal.rotation.y = -angle;
            petal.rotation.x = Math.PI / 5 + (Math.random() * 0.2 - 0.1); // Slightly more upright
            petal.scale.set(0.7 + Math.random() * 0.2 - 0.1, 0.7 + Math.random() * 0.2 - 0.1, 1);
            petal.castShadow = true;
            innerPetalsGroup.add(petal);
        }
        flowerGroup.add(innerPetalsGroup);

        // Nectar center for Type 1
        const nectarGeometry = new THREE.IcosahedronGeometry(0.08, 0);
        const nectarMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xfdcb6e,
            emissive: 0xffd700,
            emissiveIntensity: 0.5
        });
        const nectarCenter = new THREE.Mesh(nectarGeometry, nectarMaterial);
        nectarCenter.position.y = stemHeight + 0.05; // Adjusted height
        nectarCenter.name = "nectarCenter_type1";
        nectarCenter.castShadow = true;
        flowerGroup.add(nectarCenter);
        flowerGroup.userData.nectarCenterMesh = nectarCenter;


    } else if (flowerType === 'type2') {
        // --- Type 2 Petal Structure (e.g., Single Layer Daisy-like) ---
        const petalsGroup = new THREE.Group();
        petalsGroup.position.y = stemHeight;
        const numPetals = 6 + Math.floor(Math.random() * 4); // e.g., 6-9 petals
        for (let i = 0; i < numPetals; i++) {
            const petal = new THREE.Mesh(currentPetalGeometry, flowerPetalMaterial);
            const angle = (i / numPetals) * Math.PI * 2;
            const radius = 0.22; // Slightly larger radius for Type 2 petals
            petal.position.x = Math.sin(angle) * radius;
            petal.position.z = Math.cos(angle) * radius;
            petal.rotation.y = -angle;
            petal.rotation.x = Math.PI / 5 + (Math.random() * 0.1); // Tilt petals up
            petal.scale.set(0.9 + Math.random() * 0.2, 0.9 + Math.random() * 0.2, 1);
            petal.castShadow = true;
            petalsGroup.add(petal);
        }
        flowerGroup.add(petalsGroup);

        // Nectar center for Type 2
        const nectarGeometry = new THREE.SphereGeometry(0.12, 8, 8); // Larger, simpler center
        const nectarMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xfff8dc, // Creamy white
            emissive: 0xFFA500, // Orange glow
            emissiveIntensity: 0.3
        });
        const nectarCenter = new THREE.Mesh(nectarGeometry, nectarMaterial);
        nectarCenter.position.y = stemHeight + 0.02; // Lower for flatter flower
        nectarCenter.name = "nectarCenter_type2";
        nectarCenter.castShadow = true;
        flowerGroup.add(nectarCenter);
        flowerGroup.userData.nectarCenterMesh = nectarCenter;
    }

    // Add leaves (common logic for both types, using their respective currentLeafGeometry)
    const leafMaterial = new THREE.MeshPhongMaterial({
      color: stemMaterialColor, // Match stem
      side: THREE.DoubleSide,
      flatShading: true
    });
    const numLeaves = 1 + Math.floor(Math.random() * 2); // 1 or 2 leaves
    for (let i = 0; i < numLeaves; i++) {
      const leaf = new THREE.Mesh(currentLeafGeometry, leafMaterial);
      const heightFraction = 0.25 + Math.random() * 0.4;
      leaf.position.y = stemHeight * heightFraction;
      // Place leaves more distinctly to avoid stem intersection
      const leafAngle = (Math.random() - 0.5) * Math.PI * 0.8 + (i % 2 === 0 ? Math.PI / 2 : -Math.PI / 2);
      leaf.position.x = Math.sin(leafAngle) * 0.1;
      leaf.position.z = Math.cos(leafAngle) * 0.1;
      leaf.rotation.y = leafAngle + Math.PI / 2;
      leaf.rotation.x = Math.PI / 4 + (Math.random() * 0.2 - 0.1); // Angle leaves out
      leaf.castShadow = true;
      flowerGroup.add(leaf);
    }
  
    // Store metadata for the flower
    flowerGroup.userData = {
      ...flowerGroup.userData, // Preserve existing nectarCenterMesh
      type: flowerType, // Store the type of flower
      hasNectar: true,
      originalPetalColorHex: petalColorHex,
      petalMaterial: flowerPetalMaterial,
      originalNectarScale: flowerGroup.userData.nectarCenterMesh ? flowerGroup.userData.nectarCenterMesh.scale.clone() : new THREE.Vector3(1,1,1),
      // petalsGroup: flowerType === 'type1' ? outerPetalsGroup : petalsGroup, // For compatibility if needed, point to the main petal group
      cellKey: cellKey
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
          for (let k = 0; k < FLOWER_DENSITY_PER_CELL; k++) { // Adjusted loop for clarity
            if (flowers.length >= MAX_FLOWERS) break;
            const flowerX = (cellX + Math.random()) * CELL_SIZE;
            const flowerZ = (cellZ + Math.random()) * CELL_SIZE;
  
            if (
              hiveTree &&
              hiveTree.position && // Ensure hiveTree.position is defined
              Math.abs(flowerX - hiveTree.position.x) < 5 &&
              Math.abs(flowerZ - hiveTree.position.z) < 5
            ) {
              continue;
            }
            
            // Randomly choose flower type
            const flowerTypeToCreate = Math.random() < 0.6 ? 'type1' : 'type2'; // 60% chance for type1

            const flower = createFlower(flowerX, flowerZ, cellKey, flowerTypeToCreate);
            if (flower) {
              flowers.push(flower);
            }
          }
        }
      }
    }
    
    populatedCells = newPopulatedCells;
  
    // Remove far flowers (and dispose of their resources)
    const flowersToRemoveIndices = [];
    for (let i = flowers.length - 1; i >= 0; i--) {
      const flower = flowers[i];
      if (flower && flower.userData && !populatedCells.has(flower.userData.cellKey)) {
        flowersToRemoveIndices.push(i);
        // Proper disposal of Three.js objects
        flower.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => mat.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        scene.remove(flower);
      }
    }
    
    // Remove from array by sorted indices (descending) to avoid issues with shifting indices
    flowersToRemoveIndices.sort((a, b) => b - a).forEach(index => {
        flowers.splice(index, 1);
    });

  } catch (error) {
    console.error("Error managing flowers:", error);
  }
}