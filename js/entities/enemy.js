// Enemy entity — mesh factories for Hornet, Bear, Wasp

function createHornet(x, y, z) {
  try {
    const group = new THREE.Group();
    group.position.set(x, y || 4, z);

    // Body — elongated red octahedron
    const bodyGeo = new THREE.OctahedronGeometry(0.35, 0);
    bodyGeo.scale(1, 0.6, 1.6);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0xcc2200, flatShading: true });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    // Stripes
    const stripeMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
    for (let i = -1; i <= 1; i++) {
      const stripe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.08, 6),
        stripeMat
      );
      stripe.position.set(0, 0, i * 0.22);
      stripe.rotation.x = Math.PI / 2;
      group.add(stripe);
    }

    // Wings (translucent)
    const wingMat = new THREE.MeshBasicMaterial({
      color: 0xaaccff, transparent: true, opacity: 0.6, side: THREE.DoubleSide
    });
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0); wingShape.lineTo(-0.5, 0.1);
    wingShape.lineTo(-0.4, 0.4); wingShape.lineTo(0, 0.15); wingShape.lineTo(0, 0);
    const wingGeo = new THREE.ShapeGeometry(wingShape);

    const wL = new THREE.Mesh(wingGeo, wingMat);
    wL.position.set(-0.2, 0.15, 0); wL.rotation.z = 0.3; group.add(wL);
    const wR = new THREE.Mesh(wingGeo, wingMat);
    wR.position.set(0.2, 0.15, 0); wR.rotation.y = Math.PI; wR.rotation.z = -0.3; group.add(wR);

    // Stinger
    const stingerGeo = new THREE.ConeGeometry(0.06, 0.3, 4);
    const stingerMat = new THREE.MeshLambertMaterial({ color: 0x880000 });
    const stinger = new THREE.Mesh(stingerGeo, stingerMat);
    stinger.position.set(0, 0, 0.6); stinger.rotation.x = Math.PI / 2;
    group.add(stinger);

    // Metadata
    group.userData = {
      type: 'hornet',
      hp: HORNET_HP,
      maxHp: HORNET_HP,
      speed: HORNET_SPEED,
      damage: HORNET_DAMAGE,
      range: HORNET_RANGE,
      attackCooldown: HORNET_ATTACK_COOLDOWN,
      lastAttackTime: 0,
      isEnemy: true,
      wingTime: Math.random() * Math.PI * 2,
    };
    group.wingLeft  = wL;
    group.wingRight = wR;

    scene.add(group);
    return group;
  } catch(e) {
    console.error('createHornet error:', e);
    return null;
  }
}

function createBear(x, z) {
  try {
    const group = new THREE.Group();
    group.position.set(x, 0.6, z);

    const furMat = new THREE.MeshPhongMaterial({ color: 0x6b3a1f, flatShading: true });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x3d1f0a });

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.4, 1.2, 1.8);
    const body = new THREE.Mesh(bodyGeo, furMat); body.position.y = 1.0;
    body.castShadow = true; group.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const head = new THREE.Mesh(headGeo, furMat); head.position.set(0, 2.0, 0.6);
    head.castShadow = true; group.add(head);

    // Snout
    const snoutGeo = new THREE.BoxGeometry(0.45, 0.3, 0.35);
    const snout = new THREE.Mesh(snoutGeo, new THREE.MeshLambertMaterial({ color: 0x9e6030 }));
    snout.position.set(0, 1.85, 1.1); group.add(snout);

    // Eyes
    [[-0.22, 2.2, 1.0], [0.22, 2.2, 1.0]].forEach(([ex, ey, ez]) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), darkMat);
      eye.position.set(ex, ey, ez); group.add(eye);
    });

    // Ears
    [[-0.38, 2.5, 0.4], [0.38, 2.5, 0.4]].forEach(([cx, cy, cz]) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.17, 4, 4), furMat);
      ear.position.set(cx, cy, cz); group.add(ear);
    });

    // Legs
    const legGeo = new THREE.BoxGeometry(0.4, 0.9, 0.5);
    [[-0.45, 0.08, 0.55], [0.45, 0.08, 0.55], [-0.45, 0.08, -0.55], [0.45, 0.08, -0.55]].forEach(([lx,ly,lz]) => {
      const leg = new THREE.Mesh(legGeo, furMat);
      leg.position.set(lx, ly + 0.45, lz); group.add(leg);
    });

    // Metadata
    group.userData = {
      type: 'bear',
      hp: BEAR_HP,
      maxHp: BEAR_HP,
      speed: BEAR_SPEED,
      damage: BEAR_DAMAGE,
      range: BEAR_ATTACK_RANGE,
      attackCooldown: BEAR_ATTACK_COOLDOWN,
      lastAttackTime: 0,
      isEnemy: true,
      walkPhase: Math.random() * Math.PI * 2,
    };

    scene.add(group);
    return group;
  } catch(e) {
    console.error('createBear error:', e);
    return null;
  }
}

function createWasp(x, y, z) {
  try {
    const group = new THREE.Group();
    group.position.set(x, y || 3, z);

    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x1a1a00, flatShading: true });
    const yellowMat = new THREE.MeshLambertMaterial({ color: 0xd4ac00 });
    const wingMat = new THREE.MeshBasicMaterial({
      color: 0xccddaa, transparent: true, opacity: 0.5, side: THREE.DoubleSide
    });

    // Body
    const bodyGeo = new THREE.OctahedronGeometry(0.28, 0);
    bodyGeo.scale(1, 0.65, 1.5);
    const body = new THREE.Mesh(bodyGeo, bodyMat); body.castShadow = true;
    group.add(body);

    // Stripes
    for (let i = 0; i < 2; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.07, 6), yellowMat);
      s.position.set(0, 0, i * 0.2 - 0.1); s.rotation.x = Math.PI / 2;
      group.add(s);
    }

    // Wings (smaller than hornet)
    const ws = new THREE.Shape();
    ws.moveTo(0,0); ws.lineTo(-0.35,0.05); ws.lineTo(-0.28,0.32); ws.lineTo(0,0.12); ws.lineTo(0,0);
    const wg = new THREE.ShapeGeometry(ws);
    const wL = new THREE.Mesh(wg, wingMat); wL.position.set(-0.15, 0.1, 0); group.add(wL);
    const wR = new THREE.Mesh(wg, wingMat); wR.position.set(0.15, 0.1, 0); wR.rotation.y = Math.PI; group.add(wR);

    group.userData = {
      type: 'wasp',
      hp: WASP_HP,
      maxHp: WASP_HP,
      speed: WASP_SPEED,
      damage: WASP_DAMAGE,
      range: WASP_RANGE,
      attackCooldown: WASP_ATTACK_COOLDOWN,
      lastAttackTime: 0,
      isEnemy: true,
      hoverPhase: Math.random() * Math.PI * 2,
      patrolTarget: new THREE.Vector3(x, y || 3, z),
    };
    group.wingLeft  = wL;
    group.wingRight = wR;

    scene.add(group);
    return group;
  } catch(e) {
    console.error('createWasp error:', e);
    return null;
  }
}
