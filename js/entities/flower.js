// --- Configuration (Consider moving to a separate config file/object) ---
const FLOWER_CONSTANTS = {
    PETAL_COLORS: [0xff69b4, 0xffc0cb, 0xffa500, 0xffff00, 0xadd8e6, 0xdda0dd, 0xf0e68c],
    STEM_COLOR: 0x007700,
    NECTAR_COLOR: 0xffff00,
    NECTAR_DEPLETED_COLOR: 0x8B4513, // Brownish when depleted
    PETAL_BASE_WIDTH: 0.2,
    PETAL_BASE_HEIGHT: 0.5,
    NECTAR_RADIUS: 0.1,
    MIN_STEM_HEIGHT: 0.7,
    STEM_HEIGHT_VARIATION: 0.5,
    MIN_PETALS: 5,
    MAX_PETALS_ADDITIONAL: 3, // numPetals = MIN_PETALS + random(0 to this)
    PETAL_SPREAD_FACTOR: 0.28, // Slightly wider spread
    PETAL_BASE_TILT: Math.PI / 5, // More upward tilt
    PETAL_TILT_VARIATION: 0.3,
};

// --- Flower entity creation and management ---

let sharedPetalGeometry; // Remains shared

function createPetalShape() {
    const petalShape = new THREE.Shape();
    const width = FLOWER_CONSTANTS.PETAL_BASE_WIDTH;
    const height = FLOWER_CONSTANTS.PETAL_BASE_HEIGHT;

    // Adjusted bezier for a slightly more "cupped" or "pointed" look
    petalShape.moveTo(0, 0);
    petalShape.bezierCurveTo(
        width / 1.8, height / 3,   // Control point 1
        width / 1.5, (2 * height) / 3, // Control point 2
        0, height                    // Endpoint
    );
    petalShape.bezierCurveTo(
        -width / 1.5, (2 * height) / 3, // Control point 3
        -width / 1.8, height / 3,    // Control point 4
        0, 0                         // Endpoint (back to start)
    );
    // For thickness, you could use ExtrudeGeometry:
    // const extrudeSettings = { depth: 0.05, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
    // return new THREE.ExtrudeGeometry(petalShape, extrudeSettings);
    return new THREE.ShapeGeometry(petalShape);
}

// Create a single flower at the given position
function createFlower(x, z, cellKey) {
    if (!sharedPetalGeometry) {
        sharedPetalGeometry = createPetalShape();
    }

    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(x, 0, z);

    // Stem
    const stemHeight = FLOWER_CONSTANTS.MIN_STEM_HEIGHT + Math.random() * FLOWER_CONSTANTS.STEM_HEIGHT_VARIATION;
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.05, stemHeight, 8); // Slightly more tapered
    // Using MeshStandardMaterial for better lighting (ensure you have suitable lights in scene)
    const stemMaterial = new THREE.MeshStandardMaterial({
        color: FLOWER_CONSTANTS.STEM_COLOR,
        roughness: 0.8, // Less shiny
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = stemHeight / 2;
    stem.castShadow = true;
    stem.receiveShadow = true; // Stems can receive shadows from petals
    flowerGroup.add(stem);

    // Petals Group
    const petalsGroup = new THREE.Group();
    petalsGroup.position.y = stemHeight; // Petals start at the top of the stem
    flowerGroup.add(petalsGroup);

    const petalColorHex = FLOWER_CONSTANTS.PETAL_COLORS[
        Math.floor(Math.random() * FLOWER_CONSTANTS.PETAL_COLORS.length)
    ];
    const flowerPetalMaterial = new THREE.MeshStandardMaterial({
        color: petalColorHex,
        side: THREE.DoubleSide,
        roughness: 0.6,
        // metalness: 0.0 // Non-metallic
    });

    const numPetals = FLOWER_CONSTANTS.MIN_PETALS + Math.floor(Math.random() * (FLOWER_CONSTANTS.MAX_PETALS_ADDITIONAL + 1));
    for (let i = 0; i < numPetals; i++) {
        const petal = new THREE.Mesh(sharedPetalGeometry, flowerPetalMaterial);
        const angle = (i / numPetals) * Math.PI * 2;

        // Scale variation for petals
        const scaleVariation = 0.9 + Math.random() * 0.2; // Petals can be 90% to 110% of base size
        petal.scale.set(scaleVariation, scaleVariation, scaleVariation);

        petal.position.x = Math.sin(angle) * FLOWER_CONSTANTS.PETAL_SPREAD_FACTOR * (1 / scaleVariation); // Adjust spread based on scale
        petal.position.z = Math.cos(angle) * FLOWER_CONSTANTS.PETAL_SPREAD_FACTOR * (1 / scaleVariation);

        petal.rotation.y = -angle + Math.PI / 2; // Orient petal outwards
        // More pronounced tilt and variation
        petal.rotation.x = FLOWER_CONSTANTS.PETAL_BASE_TILT + (Math.random() - 0.5) * FLOWER_CONSTANTS.PETAL_TILT_VARIATION;
        petal.rotation.z = (Math.random() - 0.5) * 0.1; // Slight sideways random tilt

        petal.castShadow = true;
        // petal.receiveShadow = true; // Petals can cast shadows on each other, can be expensive
        petalsGroup.add(petal);
    }

    // Nectar Center
    const nectarGeometry = new THREE.SphereGeometry(FLOWER_CONSTANTS.NECTAR_RADIUS, 12, 8); // Slightly more segments
    const nectarMaterial = new THREE.MeshStandardMaterial({
        color: FLOWER_CONSTANTS.NECTAR_COLOR,
        roughness: 0.5,
    });
    const nectarCenter = new THREE.Mesh(nectarGeometry, nectarMaterial);
    nectarCenter.position.y = stemHeight + 0.01; // Slightly embedded in petals
    nectarCenter.name = "nectarCenter";
    nectarCenter.castShadow = true;
    flowerGroup.add(nectarCenter);

    flowerGroup.userData = {
        hasNectar: true,
        originalPetalColorHex: petalColorHex,
        petalMaterial: flowerPetalMaterial, // Still useful for direct access if needed
        nectarCenterMesh: nectarCenter,
        nectarMaterial: nectarMaterial, // Store material for color change
        originalNectarScale: nectarCenter.scale.clone(),
        originalNectarColor: new THREE.Color(FLOWER_CONSTANTS.NECTAR_COLOR),
        depletedNectarColor: new THREE.Color(FLOWER_CONSTANTS.NECTAR_DEPLETED_COLOR),
        petalsGroup: petalsGroup,
        cellKey: cellKey,
        // Function to update appearance based on nectar state
        updateNectarVisuals: function() {
            if (this.hasNectar) {
                this.nectarMaterial.color.set(this.originalNectarColor);
                // this.nectarCenterMesh.scale.copy(this.originalNectarScale); // Restore scale if changed
            } else {
                this.nectarMaterial.color.set(this.depletedNectarColor);
                // this.nectarCenterMesh.scale.set(0.5, 0.5, 0.5); // Example: shrink when depleted
            }
        }
    };
    // Initialize visual state
    flowerGroup.userData.updateNectarVisuals();

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

                    if (
                        hiveTree &&
                        Math.abs(flowerX - hiveTree.position.x) < 5 && // Assuming hiveTree is at y=0 for this check
                        Math.abs(flowerZ - hiveTree.position.z) < 5
                    ) {
                        continue;
                    }
                    flowers.push(createFlower(flowerX, flowerZ, cellKey));
                }
            }
        }
    }

    populatedCells = newPopulatedCells;

    // Remove far flowers and dispose of their non-shared resources
    const flowersToRemoveIndices = [];
    for (let i = flowers.length - 1; i >= 0; i--) {
        const flower = flowers[i];
        if (!populatedCells.has(flower.userData.cellKey)) {
            flowersToRemoveIndices.push(i);
            scene.remove(flower);

            // Dispose of geometries and materials associated with this specific flower
            // Be careful NOT to dispose sharedPetalGeometry or globally reused materials
            flower.traverse(child => {
                if (child.isMesh) {
                    // All geometries in this flower (stem, nectar) are unique instances, so dispose them
                    if (child.geometry !== sharedPetalGeometry) {
                         child.geometry.dispose();
                    }
                    // Materials: stemMaterial and nectarMaterial are created per flower instance in this version
                    // flowerPetalMaterial is also per flower instance
                    if (child.material) {
                        child.material.dispose();
                    }
                }
            });
             // If flower.userData.petalMaterial was truly shared among flowers (not the case here anymore)
             // you'd need a reference counting mechanism.
             // In this revised code, each flower gets its own stem and nectar materials.
        }
    }

    for (const index of flowersToRemoveIndices.sort((a, b) => b - a)) {
        flowers.splice(index, 1);
    }
}

// --- Dummy variables and scene for context (replace with your actual setup) ---
// const scene = new THREE.Scene();
// const bee = { position: new THREE.Vector3(0,1,0) };
// let lastBeeCellX = null;
// let lastBeeCellZ = null;
// const CELL_SIZE = 10;
// const VIEW_RADIUS_CELLS = 2;
// const MAX_FLOWERS = 100;
// const FLOWER_DENSITY_PER_CELL = 3;
// let populatedCells = new Set();
// let flowers = [];
// const hiveTree = { position: new THREE.Vector3(0,0,0) }; // Example
// Assuming you have lights:
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
// scene.add(ambientLight);
// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
// directionalLight.position.set(5, 10, 7);
// directionalLight.castShadow = true;
// scene.add(directionalLight);