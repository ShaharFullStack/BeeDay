// Grass implementation based on FluffyGrass by thebenezer
// https://github.com/thebenezer/FluffyGrass

// Grass configuration
const BLADE_COUNT = 10000;  // Number of grass blades (reduced for performance)
const BLADE_WIDTH = 0.12;    // Width of grass blade
const BLADE_HEIGHT = 0.8;    // Height of grass blade 
const BLADE_HEIGHT_VARIATION = 0.4;
const MIN_BLADE_HEIGHT = 0.5;
const GRASS_AREA_SIZE = 60; // Size of the grassy area

// Vertex shader (enhanced with FluffyGrass features)
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
  
  // Modified wind calculation function with explicit parameter access
  vec2 calculateWind(float t, vec3 offsetPos) {
    float xPos = offsetPos.x;
    float zPos = offsetPos.z;
    
    return vec2(
      sin(t * 0.3 + xPos) * 0.05 + 
      sin(t * 0.5 + xPos * 0.5) * 0.03 +
      sin(t * 0.7 + zPos) * 0.02,
      
      sin(t * 0.4 + zPos) * 0.04 + 
      sin(t * 0.6 + zPos * 0.5) * 0.02 +
      sin(t * 0.8 + xPos) * 0.03
    );  }
  
  void main() {
    vUv = uv;
    
    // Height percentage for coloring
    frc = position.y / 0.8;
    
    // Calculate wind effect based on height percentage
    vec2 windFactor = calculateWind(time, offset) * frc;
    
    // Apply wind and displacement
    float displaceX = position.x + offset.x + windFactor.x;
    float displaceY = position.y + offset.y;
    float displaceZ = position.z + offset.z + windFactor.y;
    
    // Apply blade rotation
    float x = displaceX * halfRootAngleCos + displaceZ * halfRootAngleSin;
    float y = displaceY * stretch;
    float z = displaceZ * halfRootAngleCos - displaceX * halfRootAngleSin;
    
    vec3 newPosition = vec3(x, y, z);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

// Fragment shader with enhanced coloring
const grassFragmentShader = `
  precision mediump float;
  
  uniform sampler2D map;
  
  varying vec2 vUv;
  varying float frc;
  
  void main() {
    // Better color gradient for low-poly aesthetic
    vec4 baseColor = vec4(0.16, 0.64, 0.2, 1.0);  // Darker base
    vec4 tipColor = vec4(0.45, 0.85, 0.3, 1.0);   // Brighter tip
    
    // Enhanced gradient calculation
    vec4 color = mix(baseColor, tipColor, pow(frc, 0.5));
    
    gl_FragColor = color;
  }
`;

// Create and initialize grass
function createGrass() {
  try {
    // Geometry for a single grass blade (improved blade shape)
    const bladeGeometry = new THREE.PlaneGeometry(
      BLADE_WIDTH, 
      BLADE_HEIGHT, 
      1, 
      4  // More segments for better bending
    );
    bladeGeometry.translate(0, BLADE_HEIGHT / 2, 0);
    
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
    
    // Create positions for grass instances - using FluffyGrass distribution
    for (let i = 0; i < BLADE_COUNT; i++) {
      // Generate positions in a circle with more density near the center
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
      const stretch = MIN_BLADE_HEIGHT + Math.random() * BLADE_HEIGHT_VARIATION;
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
    const grassMesh = new THREE.InstancedMesh(bladeGeometry, grassMaterial, BLADE_COUNT);
    grassMesh.castShadow = true;
    grassMesh.receiveShadow = true;
    
    // Place grass at ground level
    grassMesh.position.y = 0.1; // Slightly above ground to avoid z-fighting
    
    scene.add(grassMesh);
    
    return { mesh: grassMesh, material: grassMaterial };
  } catch (error) {
    console.error("Error creating grass:", error);
    return null;
  }
}

// Update grass animation
function updateGrass(grass, deltaTime) {
  if (grass && grass.material && grass.material.uniforms) {
    grass.material.uniforms.time.value += deltaTime;
  }
}
