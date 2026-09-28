import * as THREE from 'three';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'EnvironmentGroup';

    this.initLights();
    this.initFloor();
    this.initWorkbench();
    this.initSnapTargetGuide();

    this.scene.add(this.group);
  }

  initLights() {
    // Clean, diffused daylight studio lighting (Zero harsh shadows)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.group.add(ambientLight);

    // Key directional light for crisp casting definitions
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.85);
    mainLight.position.set(3, 6, 4);
    this.group.add(mainLight);

    // Fill light for soft shadow relief
    const fillLight = new THREE.DirectionalLight(0xf0f4f8, 0.5);
    fillLight.position.set(-3, 4, -2);
    this.group.add(fillLight);

    // Specular highlight light for hard-chrome columns and machine star wheel
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.65);
    rimLight.position.set(1.5, 3.0, 3.5);
    this.group.add(rimLight);
  }

  initFloor() {
    // Seamless clean studio floor (No grid lines, no yellow boundary ring)
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xedf2f7,
      roughness: 0.5,
      metalness: 0.05
    });

    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    this.group.add(floorMesh);
  }

  initWorkbench() {
    // Minimalist, sleek inspection workbench
    const benchGroup = new THREE.Group();
    benchGroup.position.set(-0.95, 0, 0);

    // Bench tabletop (Clean matte off-white)
    const topGeo = new THREE.BoxGeometry(0.9, 0.04, 1.2);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
      metalness: 0.05
    });
    const benchTop = new THREE.Mesh(topGeo, topMat);
    benchTop.position.y = 0.83;
    benchGroup.add(benchTop);

    // Clean brushed aluminum legs
    const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.81, 16);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.3,
      metalness: 0.6
    });

    const legOffsets = [
      [-0.4, 0.405, -0.52],
      [0.4, 0.405, -0.52],
      [-0.4, 0.405, 0.52],
      [0.4, 0.405, 0.52]
    ];

    legOffsets.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, y, z);
      benchGroup.add(leg);
    });

    // Sleek inspection pad (Soft neutral)
    const padGeo = new THREE.BoxGeometry(0.7, 0.005, 0.9);
    const padMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.8,
      metalness: 0.05
    });
    const pad = new THREE.Mesh(padGeo, padMaterial);
    pad.position.set(0, 0.8525, 0);
    benchGroup.add(pad);

    this.group.add(benchGroup);
  }

  initSnapTargetGuide() {
    // Subtle, clean snap guide cylinder between grips (300mm gauge span)
    const guideGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.30, 24, 1, true);
    const guideMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.0
    });
    this.snapGuide = new THREE.Mesh(guideGeo, guideMat);
    this.snapGuide.position.set(0, 1.15, 0);
    this.group.add(this.snapGuide);
  }

  setSnapGuideState(state) {
    if (!this.snapGuide) return;
    if (state === 'active') {
      this.snapGuide.material.opacity = 0.8;
      this.snapGuide.material.color.setHex(0x16a34a);
    } else if (state === 'hover') {
      this.snapGuide.material.opacity = 0.45;
      this.snapGuide.material.color.setHex(0x0284c7);
    } else {
      this.snapGuide.material.opacity = 0.0;
    }
  }
}
