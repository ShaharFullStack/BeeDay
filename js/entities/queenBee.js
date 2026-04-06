// Queen Bee — a special NPC that hovers near the hive entrance

function createQueenBee() {
  try {
    if (!hive) return null;

    const group = new THREE.Group();

    // Body — larger, golden
    const bodyGeo = new THREE.OctahedronGeometry(0.42, 1);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0xffd700, flatShading: true });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    // Stripes
    const stripeMat = new THREE.MeshLambertMaterial({ color: 0x1a0a00 });
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.055, 6, 16), stripeMat);
      s.position.y = 0.18 - i * 0.18;
      group.add(s);
    }

    // Crown (golden ring + small spikes on top)
    const crownMat = new THREE.MeshPhongMaterial({ color: 0xffc200, emissive: 0xffa000, emissiveIntensity: 0.6 });
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 6, 16), crownMat);
    crown.position.y = 0.55;
    group.add(crown);

    const spikeMat = new THREE.MeshLambertMaterial({ color: 0xffe44d });
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.13, 4), spikeMat);
      spike.position.set(Math.cos(angle) * 0.22, 0.65, Math.sin(angle) * 0.22);
      group.add(spike);
    }

    // Wings — larger, slightly purple tint
    const wingMat = new THREE.MeshBasicMaterial({
      color: 0xd8b4fe, transparent: true, opacity: 0.75, side: THREE.DoubleSide
    });
    const ws = new THREE.Shape();
    ws.moveTo(0, 0); ws.lineTo(-0.55, 0.1); ws.lineTo(-0.44, 0.44); ws.lineTo(0, 0.18); ws.lineTo(0, 0);
    const wg = new THREE.ShapeGeometry(ws);
    const wingsGroup = new THREE.Group();
    const wL = new THREE.Mesh(wg, wingMat); wL.position.set(-0.24, 0.22, 0); wL.rotation.z = 0.2; wingsGroup.add(wL);
    const wR = new THREE.Mesh(wg, wingMat); wR.position.set(0.24, 0.22, 0); wR.rotation.y = Math.PI; wR.rotation.z = -0.2; wingsGroup.add(wR);
    group.add(wingsGroup);

    // Position near hive entrance, slightly above
    const hivePos = hive.position;
    group.position.set(hivePos.x, hivePos.y + 2.5, hivePos.z + 2);
    group.scale.set(0.55, 0.55, 0.55);

    group.userData = {
      isQueenBee: true,
      baseY: hivePos.y + 2.5,
      hoverPhase: 0,
      wingsGroup,
    };
    group.wingsGroup = wingsGroup;

    scene.add(group);
    queenBee = group;
    return group;
  } catch(e) {
    console.error('createQueenBee error:', e);
    return null;
  }
}

// Called every frame to animate the queen bee
function updateQueenBee(dt) {
  if (!queenBee) return;
  queenBee.userData.hoverPhase += dt * 1.2;
  queenBee.position.y = queenBee.userData.baseY + Math.sin(queenBee.userData.hoverPhase) * 0.3;
  queenBee.rotation.y += dt * 0.4;

  // Wing flap
  if (queenBee.wingsGroup) {
    queenBee.wingsGroup.children.forEach((w, i) => {
      w.rotation.y = (i === 0 ? 1 : -1) * Math.sin(Date.now() * 0.015) * 0.5;
    });
  }
}
