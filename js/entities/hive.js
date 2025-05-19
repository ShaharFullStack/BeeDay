// --- Configuration (Consider moving to a separate config file/object) ---
const HIVE_CONSTANTS = {
    LOW_POLY_SEGMENTS: 8, // For a distinct low-poly look
    HIVE_BASE_RADIUS_TOP: 1.2,
    HIVE_BASE_RADIUS_BOTTOM: 1.5,
    HIVE_BASE_HEIGHT: 2,
    HIVE_BASE_HEIGHT_SEGMENTS: 3, // Increased for more deformation potential
    HIVE_TOP_RADIUS: 1.2,
    HIVE_TOP_HEIGHT: 1.0, // Slightly shorter top
    HIVE_COLOR: 0xfdcb6e, // Main hive yellow
    HIVE_VERTEX_OFFSET: 0.15, // Increased offset for more pronounced lumps
    ENTRANCE_RADIUS: 0.25, // Slightly smaller entrance
    ENTRANCE_COLOR: 0x4a3000, // Darker brown for entrance
    HONEYCOMB_HEX_SIZE: 0.2,
    HONEYCOMB_COLOR: 0xd0a000, // Darker yellow for honeycomb cells
    HONEYCOMB_OPACITY: 1.0, // Solid cells
    NUM_HONEYCOMBS: 15,
    BRANCH_COLOR: 0x8B5A2B, // Assuming TREE_TRUNK_COLOR, define it here
    BRANCH_LENGTH: 2.0,
    BRANCH_RADIUS_START: 0.25,
    BRANCH_RADIUS_END: 0.2,
};

// Assume scene and hiveTree are defined elsewhere
// let scene, hiveTree, hive; // If hive is global

// Create the beehive attached to the hive tree
function createHive() {
    if (!hiveTree) {
        console.error("Hive tree not defined before creating hive!");
        return null; // Return null or throw error
    }

    // --- Main Hive Group ---
    const hiveGroup = new THREE.Group();

    // --- Hive Material ---
    const hiveMaterial = new THREE.MeshLambertMaterial({
        color: HIVE_CONSTANTS.HIVE_COLOR,
        flatShading: true,
    });

    // --- Main hive body - low-poly cylinder ---
    const hiveBaseGeometry = new THREE.CylinderGeometry(
        HIVE_CONSTANTS.HIVE_BASE_RADIUS_TOP,
        HIVE_CONSTANTS.HIVE_BASE_RADIUS_BOTTOM,
        HIVE_CONSTANTS.HIVE_BASE_HEIGHT,
        HIVE_CONSTANTS.LOW_POLY_SEGMENTS,
        HIVE_CONSTANTS.HIVE_BASE_HEIGHT_SEGMENTS, // More segments for better deformation
        false // openEnded - false means it has caps
    );

    // Randomize vertex positions for an organic feel (excluding top/bottom caps if possible)
    const positionAttribute = hiveBaseGeometry.getAttribute('position');
    const normalAttribute = hiveBaseGeometry.getAttribute('normal'); // To displace along normal
    const vertex = new THREE.Vector3();
    const normalVec = new THREE.Vector3();

    // Identify top and bottom y levels to preserve caps somewhat
    const cylinderHalfHeight = HIVE_CONSTANTS.HIVE_BASE_HEIGHT / 2;
    const epsilon = 0.01; // Tolerance for Y comparison

    for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);
        normalVec.fromBufferAttribute(normalAttribute, i);

        // Affect vertices that are not on the flat top or bottom caps
        // This targets vertices on the sides.
        if (Math.abs(vertex.y) < cylinderHalfHeight - epsilon && normalVec.y < 0.9 && normalVec.y > -0.9 ) { // Check normal.y to avoid cap centers
             if (Math.random() > 0.3) { // Modify more vertices but not all
                const offsetMagnitude = (Math.random() * HIVE_CONSTANTS.HIVE_VERTEX_OFFSET * 2) - HIVE_CONSTANTS.HIVE_VERTEX_OFFSET;
                // Displace along the vertex normal for a more natural bulge/dent
                positionAttribute.setXYZ(
                    i,
                    vertex.x + normalVec.x * offsetMagnitude * 0.5, // Reduce normal influence if too spiky
                    vertex.y + normalVec.y * offsetMagnitude * (Math.random() * 0.3), // Less Y displacement
                    vertex.z + normalVec.z * offsetMagnitude * 0.5
                );
            }
        }
    }
    positionAttribute.needsUpdate = true;
    hiveBaseGeometry.computeVertexNormals(); // Recompute normals AFTER displacement

    const hiveBase = new THREE.Mesh(hiveBaseGeometry, hiveMaterial);
    hiveBase.castShadow = true;
    hiveBase.receiveShadow = true;
    hiveGroup.add(hiveBase);

    // --- Top dome of the hive - low-poly cone ---
    const hiveTopGeometry = new THREE.ConeGeometry(
        HIVE_CONSTANTS.HIVE_TOP_RADIUS,
        HIVE_CONSTANTS.HIVE_TOP_HEIGHT,
        HIVE_CONSTANTS.LOW_POLY_SEGMENTS,
        1 // Height segments
    );
    // It's good to also slightly deform the top for consistency
    const topPositionAttribute = hiveTopGeometry.getAttribute('position');
    for (let i = 0; i < topPositionAttribute.count; i++) {
        if (Math.random() > 0.6 && topPositionAttribute.getY(i) < HIVE_CONSTANTS.HIVE_TOP_HEIGHT * 0.9) { // Avoid tip
            const offset = HIVE_CONSTANTS.HIVE_VERTEX_OFFSET * 0.5; // Smaller offset for top
            topPositionAttribute.setX(i, topPositionAttribute.getX(i) + (Math.random() * offset * 2) - offset);
            topPositionAttribute.setZ(i, topPositionAttribute.getZ(i) + (Math.random() * offset * 2) - offset);
        }
    }
    topPositionAttribute.needsUpdate = true;
    hiveTopGeometry.computeVertexNormals();

    const hiveTop = new THREE.Mesh(hiveTopGeometry, hiveMaterial);
    hiveTop.position.y = HIVE_CONSTANTS.HIVE_BASE_HEIGHT / 2; // Position on top of base
    hiveTop.castShadow = true;
    hiveTop.receiveShadow = true;
    hiveGroup.add(hiveTop);

    // --- Entrance hole ---
    // Positioned on the positive Z face of the hive base.
    const entranceRadius = HIVE_CONSTANTS.HIVE_BASE_RADIUS_BOTTOM; // Approx radius at entrance height
    const entranceYPosition = -HIVE_CONSTANTS.HIVE_BASE_HEIGHT * 0.25; // Lower part of hive

    const entranceGeometry = new THREE.CircleGeometry(HIVE_CONSTANTS.ENTRANCE_RADIUS, HIVE_CONSTANTS.LOW_POLY_SEGMENTS);
    const entranceMaterial = new THREE.MeshLambertMaterial({ // Changed to Lambert for consistency
        color: HIVE_CONSTANTS.ENTRANCE_COLOR,
        flatShading: true,
        side: THREE.DoubleSide // In case it pokes through slightly
    });
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    // Place it on the surface, slightly inset
    entrance.position.set(0, entranceYPosition, entranceRadius * 0.95); // Slightly inset
    entrance.lookAt(0, entranceYPosition, entranceRadius + 1); // Make it face outwards
    hiveGroup.add(entrance);


    // --- Honeycomb pattern ---
    const honeycombPattern = createHoneycombPattern(
        // Pass relevant radii for more accurate placement
        (HIVE_CONSTANTS.HIVE_BASE_RADIUS_TOP + HIVE_CONSTANTS.HIVE_BASE_RADIUS_BOTTOM) / 2,
        HIVE_CONSTANTS.HIVE_BASE_HEIGHT
    );
    // honeycombPattern.position.y = 0; // Adjust if necessary, but local to hiveGroup is fine
    hiveGroup.add(honeycombPattern);


    // --- Branch connecting hive to tree ---
    const branchMaterial = new THREE.MeshLambertMaterial({
        color: HIVE_CONSTANTS.BRANCH_COLOR, // Assuming this is like TREE_TRUNK_COLOR
        flatShading: true
    });
    const branchGeometry = new THREE.CylinderGeometry(
        HIVE_CONSTANTS.BRANCH_RADIUS_END, // Tapered: thinner at hive end
        HIVE_CONSTANTS.BRANCH_RADIUS_START, // thicker at tree end
        HIVE_CONSTANTS.BRANCH_LENGTH,
        HIVE_CONSTANTS.LOW_POLY_SEGMENTS / 2 // Fewer segments for branch
    );
    const branch = new THREE.Mesh(branchGeometry, branchMaterial);
    branch.castShadow = true;
    branch.receiveShadow = true;

    // Position branch relative to the tree trunk
    // Assuming hiveTree is a Group and its position is the base of the trunk
    const trunkAttachHeight = hiveTree.userData.trunkHeight * 0.75; // Attach 75% up the trunk
    branch.position.copy(hiveTree.position); // Start at tree's origin
    branch.position.y += trunkAttachHeight;

    // Orient the branch: point it somewhat horizontally and then rotate around Y
    branch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0.5, 0).normalize()); // Angled up and out along X
    // Randomize direction a bit
    const randomYRotation = Math.random() * Math.PI * 2;
    branch.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), randomYRotation));

    scene.add(branch); // Add branch to the main scene or as child of hiveTree

    // --- Position hiveGroup at the end of the branch ---
    const branchWorldDirection = new THREE.Vector3();
    branch.getWorldDirection(branchWorldDirection); // Gets direction vector in world space

    const branchEndPoint = new THREE.Vector3();
    // The branch geometry's length is along its local Y axis. We need to transform this.
    // Create a vector representing the tip of the branch in its local space
    const localTip = new THREE.Vector3(0, HIVE_CONSTANTS.BRANCH_LENGTH / 2, 0);
    branch.localToWorld(localTip); // Convert local tip to world space
    hiveGroup.position.copy(localTip);

    // Optionally, orient the hive to hang naturally (e.g., mostly downwards)
    hiveGroup.rotation.x = Math.PI * 0.25; // Slight tilt

    // Assign to global `hive` variable if that's your pattern
    window.hive = hiveGroup; // Or just 'hive =' if defined in broader scope
    scene.add(hiveGroup);

    return hiveGroup;
}

// Create honeycomb pattern for hive
function createHoneycombPattern(hiveAverageRadius, hiveHeight) {
    const patternGroup = new THREE.Group();
    const hexMaterial = new THREE.MeshLambertMaterial({ // Use Lambert for lighting consistency
        color: HIVE_CONSTANTS.HONEYCOMB_COLOR,
        flatShading: true,
        // transparent: HIVE_CONSTANTS.HONEYCOMB_OPACITY < 1,
        // opacity: HIVE_CONSTANTS.HONEYCOMB_OPACITY,
    });

    for (let i = 0; i < HIVE_CONSTANTS.NUM_HONEYCOMBS; i++) {
        const hexGeometry = new THREE.CircleGeometry(HIVE_CONSTANTS.HONEYCOMB_HEX_SIZE, 6); // 6 sides for hexagon
        const hex = new THREE.Mesh(hexGeometry, hexMaterial);

        // Position hexagons randomly around the hive body's cylindrical part
        const angle = Math.random() * Math.PI;
        const surfaceRadius = hiveAverageRadius * (0.9 + Math.random() * 0.1); // Place on or slightly inside estimated surface

        hex.position.x = Math.sin(angle) * surfaceRadius;
        hex.position.z = Math.cos(angle) * surfaceRadius;
        // Distribute along the main body height, avoiding very top/bottom
        hex.position.y = (Math.random() - 0.5) * (hiveHeight * 0.8);

        // Orient hexagon to be flat against the hive surface
        // Point the hexagon outwards from the center of the hive
        const hiveCenterToHex = hex.position.clone().normalize();
        const up = new THREE.Vector3(0,1,0); // Default 'up' for the hexagon face
        hex.quaternion.setFromUnitVectors(up, hiveCenterToHex); // Align hex 'up' (normal) with direction from center

        // For a slight indent/extrude effect, could push slightly along normal
        // hex.position.addScaledVector(hiveCenterToHex, -0.02); // Slight indent

        patternGroup.add(hex);
    }
    return patternGroup;
}

// --- Example Usage (ensure these are defined in your actual code) ---
// const scene = new THREE.Scene();
// scene.add(new THREE.AmbientLight(0xffffff, 0.5));
// const dirLight = new THREE.DirectionalLight(0xffffff, 1);
// dirLight.position.set(5,10,7);
// dirLight.castShadow = true;
// scene.add(dirLight);

// const hiveTree = new THREE.Group(); // Mock hiveTree
// hiveTree.position.set(0, 0, 0);
// hiveTree.userData = { trunkHeight: 5 }; // Example userData
// scene.add(hiveTree);

// let hive = createHive(); // Call the function

// console.log("Hive created:", hive);