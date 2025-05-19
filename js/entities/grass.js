// Grass implementation based on FluffyGrass by thebenezer
// https://github.com/thebenezer/FluffyGrass

// Grass configuration
const BLADE_COUNT = 100000; // Number of grass blades to render
const BLADE_WIDTH = 0.12;  // Width of grass blade
const BLADE_HEIGHT = 0.8;  // Height of grass blade
const BLADE_HEIGHT_VARIATION = 0.4; // Variation in grass blade height
const BLADE_SEGMENTS = 5;  // Number of segments per blade (more = smoother but slower)
const GRASS_AREA_SIZE = 60; // Size of the grassy area

// Vertex shader for grass
const grassVertexShader = `
  precision mediump float;
  
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float time;
  
  attribute vec3 position;
  attribute vec3 offset;
  attribute vec2 uv;
  attribute float angle;
  attribute float halfRootAngleSin;
  attribute float halfRootAngleCos;
  attribute float stretch;
  
  varying vec2 vUv;
  varying float frc;
  
  void main() {
    vUv = uv;
    
    // Blade position and rotation
    float radiusCoord = position.y / float(${BLADE_HEIGHT});
    
    // Grass blade wind movement
    float windStrength = 0.3;
    float wind = (sin(time * 0.3) + sin(time * 0.5)) * windStrength * radiusCoord;
    
    // Blade displacement calculation
    float displaceX = position.x + offset.x + wind;
    float displaceY = position.y + offset.y;
    float displaceZ = position.z + offset.z;
    
    // Apply rotation
    float x = displaceX * halfRootAngleCos + displaceZ * halfRootAngleSin;
    float y = displaceY * stretch;
    float z = displaceZ * halfRootAngleCos - displaceX * halfRootAngleSin;
    
    // Calculate vertex position
    vec3 newPosition = vec3(x, y, z);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    
    // Calculate fragment coord for color gradient
    frc = position.y / float(${BLADE_HEIGHT});
  }
`;

// Fragment shader for grass
const grassFragmentShader = `
  precision mediump float;
  
  uniform sampler2D map;
  
  varying vec2 vUv;
  varying float frc;
  
  void main() {
    // Base grass color (slightly different green for low-poly aesthetic)
    vec4 baseColor = vec4(0.2, 0.7, 0.2, 1.0);
    vec4 tipColor = vec4(0.5, 0.8, 0.3, 1.0);
    
    // Gradient from base to tip
    vec4 color = mix(baseColor, tipColor, frc);
    
    gl_FragColor = color;
  }
`;

// Create and initialize grass
function createGrass() {
  try {
    // Geometry for a single grass blade
    const bladeGeometry = new THREE.PlaneGeometry(BLADE_WIDTH, BLADE_HEIGHT, 1, BLADE_SEGMENTS);
    bladeGeometry.translate(0, BLADE_HEIGHT / 2, 0); // Center grass at bottom
    
    // Grass material using custom shaders
    const grassMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        map: { value: null }
      },
      side: THREE.DoubleSide,
      vertexShader: grassVertexShader,
      fragmentShader: grassFragmentShader
    });
    
    // Instance geometry attributes
    const offsetAttribute = new THREE.InstancedBufferAttribute(new Float32Array(BLADE_COUNT * 3), 3);
    const stretchAttribute = new THREE.InstancedBufferAttribute(new Float32Array(BLADE_COUNT), 1);
    const angleAttribute = new THREE.InstancedBufferAttribute(new Float32Array(BLADE_COUNT), 1);
    const halfRootAngleSinAttribute = new THREE.InstancedBufferAttribute(new Float32Array(BLADE_COUNT), 1);
    const halfRootAngleCosAttribute = new THREE.InstancedBufferAttribute(new Float32Array(BLADE_COUNT), 1);
    
    // Create random positions and properties for each grass blade
    for (let i = 0; i < BLADE_COUNT; i++) {
      // Random position in circle
      const radius = Math.sqrt(Math.random()) * GRASS_AREA_SIZE;
      const theta = Math.random() * Math.PI * 2;
      
      // Position
      offsetAttribute.setXYZ(
        i,
        radius * Math.cos(theta),
        0,
        radius * Math.sin(theta)
      );
      
      // Stretch (height variation)
      const stretch = 0.5 + Math.random() * BLADE_HEIGHT_VARIATION;
      stretchAttribute.setX(i, stretch);
      
      // Rotation
      const angle = Math.random() * Math.PI * 2;
      angleAttribute.setX(i, angle);
      
      // Pre-compute sin and cos for rotation calculations
      const halfRootAngle = angle / 2;
      halfRootAngleSinAttribute.setX(i, Math.sin(halfRootAngle));
      halfRootAngleCosAttribute.setX(i, Math.cos(halfRootAngle));
    }
    
    // Add instance attributes to geometry
    bladeGeometry.setAttribute('offset', offsetAttribute);
    bladeGeometry.setAttribute('stretch', stretchAttribute);
    bladeGeometry.setAttribute('angle', angleAttribute);
    bladeGeometry.setAttribute('halfRootAngleSin', halfRootAngleSinAttribute);
    bladeGeometry.setAttribute('halfRootAngleCos', halfRootAngleCosAttribute);
    
    // Create instanced mesh
    const grass = new THREE.InstancedMesh(bladeGeometry, grassMaterial, BLADE_COUNT);
    grass.castShadow = true;
    grass.receiveShadow = true;
    
    // Place grass at ground level
    grass.position.y = 0.1; // Slightly above ground to avoid z-fighting
    
    scene.add(grass);
    
    // Return the grass object and material for animation updates
    return { mesh: grass, material: grassMaterial };
  } catch (error) {
    console.error("Error creating grass:", error);
    return null;
  }
}

// Update grass animation
function updateGrass(grass, deltaTime) {
  if (grass && grass.material) {
    grass.material.uniforms.time.value += deltaTime;
  }
}