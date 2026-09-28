import * as THREE from 'three';
import { MATERIALS } from '../../physics/MaterialConstants.js';
import { events } from '../../core/EventBus.js';

export class SpecimenModel {
  constructor(scene, diameter_mm = 8, materialKey = 'MILD_STEEL') {
    this.scene = scene;
    this.diameter_mm = diameter_mm;
    this.materialKey = materialKey;
    this.gaugeLength_mm = 300;
    this.gaugeLength_m = 0.30;
    this.overallLength_m = 0.40;

    this.group = new THREE.Group();
    this.group.name = 'SpecimenModelGroup';

    // State tracking
    this.isMounted = false;
    this.isMounting = false;
    this.isDragging = false;
    this.isFractured = false;
    this.isRecoiling = false;
    this.recoilTime = 0.0;
    this.mountProgress = 0.0;
    this.lastElongationMeters = 0.0;
    this.lastNeckProgress = 0.0;

    this.benchPosition = new THREE.Vector3(-0.95, 0.865, 0);
    this.utmPosition = new THREE.Vector3(0, 1.15, 0);
    this.brokenPieces = [];

    this.initMaterial();
    this.buildGeometry();
    this.setRestingOnBench();

    this.scene.add(this.group);
    this.bindEvents();
  }

  initMaterial() {
    const matConfig = MATERIALS[this.materialKey] || MATERIALS.MILD_STEEL;
    this.material = new THREE.MeshStandardMaterial({
      color: matConfig.colorHex,
      metalness: matConfig.metalness,
      roughness: matConfig.roughness
    });

    // Reference gauge mark rings material (High contrast laser etch)
    this.matGaugeMark = new THREE.MeshBasicMaterial({
      color: 0x0284c7, // Precision blue line
      wireframe: true
    });

    // Exposed metallic fracture surface (Fibrous ductile face or crystalline cleavage)
    this.matFractureFace = new THREE.MeshStandardMaterial({
      color: this.materialKey === 'MILD_STEEL' ? 0x475569 : 0x1e293b,
      roughness: 0.98,
      metalness: 0.1
    });
  }

  buildGeometry() {
    // Clear any previous geometry
    while (this.group.children.length > 0) {
      const obj = this.group.children[0];
      this.group.remove(obj);
    }
    this.brokenPieces = [];
    this.isFractured = false;
    this.isRecoiling = false;

    const radius = (this.diameter_mm / 2) * 0.001; // Radius in meters
    const gripRadius = radius * 1.5;               // Enlarged shoulder grip ends
    const gripLength = 0.05;                       // 50mm grip section
    const transitionLength = 0.02;                 // 20mm transition shoulder
    const halfGauge = this.gaugeLength_m / 2;

    // 1. Central Gauge Cylinder (Subdivided axially into 64 rings for smooth necking deformation)
    this.radialSegments = 32;
    this.heightSegments = 64;
    this.gaugeGeo = new THREE.CylinderGeometry(
      radius,
      radius,
      this.gaugeLength_m,
      this.radialSegments,
      this.heightSegments
    );
    this.initialVertices = this.gaugeGeo.attributes.position.clone();

    this.gaugeMesh = new THREE.Mesh(this.gaugeGeo, this.material);
    this.group.add(this.gaugeMesh);

    // 2. Lower Stationary Assembly Group (Clamped in base grip)
    this.lowerAssembly = new THREE.Group();

    const lowerGripGeo = new THREE.CylinderGeometry(gripRadius, gripRadius, gripLength, 24);
    const lowerGrip = new THREE.Mesh(lowerGripGeo, this.material);
    lowerGrip.position.y = -halfGauge - transitionLength - (gripLength / 2);
    this.lowerAssembly.add(lowerGrip);

    const lowerTransGeo = new THREE.CylinderGeometry(radius, gripRadius, transitionLength, 24);
    const lowerTrans = new THREE.Mesh(lowerTransGeo, this.material);
    lowerTrans.position.y = -halfGauge - (transitionLength / 2);
    this.lowerAssembly.add(lowerTrans);

    const ringGeo = new THREE.TorusGeometry(radius + 0.0003, 0.0004, 8, 32);
    this.bottomGaugeMark = new THREE.Mesh(ringGeo, this.matGaugeMark);
    this.bottomGaugeMark.rotation.x = Math.PI / 2;
    this.bottomGaugeMark.position.y = -halfGauge;
    this.lowerAssembly.add(this.bottomGaugeMark);

    this.group.add(this.lowerAssembly);

    // 3. Upper Moving Assembly Group (Clamped in moving crosshead)
    this.upperAssembly = new THREE.Group();

    const upperGripGeo = new THREE.CylinderGeometry(gripRadius, gripRadius, gripLength, 24);
    const upperGrip = new THREE.Mesh(upperGripGeo, this.material);
    upperGrip.position.y = halfGauge + transitionLength + (gripLength / 2);
    this.upperAssembly.add(upperGrip);

    const upperTransGeo = new THREE.CylinderGeometry(gripRadius, radius, transitionLength, 24);
    const upperTrans = new THREE.Mesh(upperTransGeo, this.material);
    upperTrans.position.y = halfGauge + (transitionLength / 2);
    this.upperAssembly.add(upperTrans);

    this.topGaugeMark = new THREE.Mesh(ringGeo, this.matGaugeMark);
    this.topGaugeMark.rotation.x = Math.PI / 2;
    this.topGaugeMark.position.y = halfGauge;
    this.upperAssembly.add(this.topGaugeMark);

    this.group.add(this.upperAssembly);
  }

  setRestingOnBench() {
    this.isMounted = false;
    this.isMounting = false;
    this.isFractured = false;
    this.isRecoiling = false;
    // Lie horizontally on workbench felt pad along Z-axis
    this.group.rotation.set(Math.PI / 2, 0, 0);
    this.group.position.copy(this.benchPosition);
    if (this.upperAssembly) this.upperAssembly.position.set(0, 0, 0);
    if (this.lowerAssembly) this.lowerAssembly.position.set(0, 0, 0);
  }

  mountToUTM() {
    this.isMounting = true;
    this.mountProgress = 0.0;
  }

  update(delta = 0.016) {
    // 1. Specimen mounting animation
    if (this.isMounting) {
      this.mountProgress += 0.06;
      if (this.mountProgress >= 1.0) {
        this.mountProgress = 1.0;
        this.snapToUTM();
      } else {
        const t = this.mountProgress;
        const smoothT = t * t * (3 - 2 * t);
        this.group.position.lerpVectors(this.benchPosition, this.utmPosition, smoothT);
        this.group.position.y += Math.sin(t * Math.PI) * 0.22;
        this.group.rotation.set((1 - smoothT) * (Math.PI / 2), 0, 0);
      }
    }

    // 2. High-energy elastic recoil vibration after central fracture
    if (this.isRecoiling) {
      this.recoilTime += delta;
      const decay = Math.exp(-14.0 * this.recoilTime);
      const vibration = Math.sin(this.recoilTime * 55.0) * 0.007 * decay;

      const totalUpperLift = this.recoilBaseLift + vibration;

      if (this.upperAssembly) {
        this.upperAssembly.position.y = this.lastElongationMeters + totalUpperLift;
      }
      if (this.upperStem) {
        this.upperStem.position.y = this.upperStemBaseY + totalUpperLift;
      }
      if (this.upperCap) {
        this.upperCap.position.y = this.upperCapBaseY + totalUpperLift;
      }

      // Reactionary shudder on lower base fixture
      const lowerShudder = -Math.abs(vibration * 0.3);
      if (this.lowerAssembly) this.lowerAssembly.position.y = lowerShudder;
      if (this.lowerStem) this.lowerStem.position.y = this.lowerStemBaseY + lowerShudder;
      if (this.lowerCap) this.lowerCap.position.y = this.lowerCapBaseY + lowerShudder;

      if (this.recoilTime > 0.45) {
        this.isRecoiling = false;
        if (this.lowerAssembly) this.lowerAssembly.position.y = 0;
        if (this.lowerStem) this.lowerStem.position.y = this.lowerStemBaseY;
        if (this.lowerCap) this.lowerCap.position.y = this.lowerCapBaseY;
        if (this.upperAssembly) this.upperAssembly.position.y = this.lastElongationMeters + this.recoilBaseLift;
        if (this.upperStem) this.upperStem.position.y = this.upperStemBaseY + this.recoilBaseLift;
        if (this.upperCap) this.upperCap.position.y = this.upperCapBaseY + this.recoilBaseLift;
      }
    }
  }

  snapToUTM() {
    this.isMounted = true;
    this.isMounting = false;
    this.isDragging = false;
    // Stand vertically along Y-axis between UTM grips
    this.group.rotation.set(0, 0, 0);
    this.group.position.copy(this.utmPosition);

    events.emit('SPECIMEN_MOUNTED', {
      diameter_mm: this.diameter_mm,
      material: this.materialKey
    });
  }

  applyDeformation(elongation_mm, strain, isNecking = false, neckFactor = 0) {
    if (!this.gaugeGeo || this.isFractured) return;

    const elongationMeters = elongation_mm * 0.001;
    this.lastElongationMeters = elongationMeters;
    this.lastNeckProgress = neckFactor;

    const currentLength = this.gaugeLength_m + elongationMeters;
    const posAttr = this.gaugeGeo.attributes.position;
    const origPos = this.initialVertices;

    const baseRadius = (this.diameter_mm / 2) * 0.001;
    // Isochoric volume conservation: A * L = A0 * L0 => r = r0 * sqrt(L0 / L)
    const uniformRadius = baseRadius * Math.sqrt(this.gaugeLength_m / currentLength);

    for (let i = 0; i < posAttr.count; i++) {
      const origX = origPos.getX(i);
      const origY = origPos.getY(i);
      const origZ = origPos.getZ(i);

      // Shift stretched coordinates so stationary lower grip stays at -halfGauge
      const normalizedY = (origY + (this.gaugeLength_m / 2)) / this.gaugeLength_m; // 0.0 to 1.0
      const newY = -(this.gaugeLength_m / 2) + normalizedY * currentLength;

      // Radial necking calculation: Localized precisely at the physical center
      // Stretched center is at newY = -(gaugeLength_m/2) + currentLength/2 = elongationMeters / 2
      const centerWorldY = elongationMeters / 2;
      const distFromCenter = newY - centerWorldY;

      let currentR = uniformRadius;
      if (isNecking && neckFactor > 0) {
        const neckSigma = 0.032; // Localized neck width in meters
        const gaussian = Math.exp(-(distFromCenter * distFromCenter) / (2 * neckSigma * neckSigma));
        // Contract neck radius up to 45% reduction for mild steel
        currentR = uniformRadius * (1.0 - 0.45 * neckFactor * gaussian);
      }

      const angle = Math.atan2(origZ, origX);
      const newX = currentR * Math.cos(angle);
      const newZ = currentR * Math.sin(angle);

      posAttr.setXYZ(i, newX, newY, newZ);
    }

    posAttr.needsUpdate = true;
    this.gaugeGeo.computeVertexNormals();

    // Shift upper grip assembly upward with the moving crosshead
    if (this.upperAssembly) {
      this.upperAssembly.position.y = elongationMeters;
    }
  }

  triggerFracture() {
    if (this.isFractured) return;
    this.isFractured = true;

    // 1. Completely hide and detach continuous unbroken gauge cylinder
    if (this.gaugeMesh) {
      this.gaugeMesh.visible = false;
      this.group.remove(this.gaugeMesh);
    }

    // 2. Remove any previous broken pieces
    this.brokenPieces.forEach(p => this.group.remove(p));
    this.brokenPieces = [];

    const isMildSteel = this.materialKey === 'MILD_STEEL';
    const radius = (this.diameter_mm / 2) * 0.001;
    const elongationMeters = this.lastElongationMeters || (this.gaugeLength_m * 0.24);
    const currentLength = this.gaugeLength_m + elongationMeters;

    // The physical breaking plane is EXACTLY at the center of the stretched specimen (Y_center = dL / 2)
    const breakCenterY = elongationMeters / 2;

    const baseRadius = radius * Math.sqrt(this.gaugeLength_m / currentLength);
    // Necked radius at fracture plane (~55% reduction in area for mild steel, 0% for cast iron)
    const neckRadius = isMildSteel ? (baseRadius * Math.sqrt(1 - 0.55)) : baseRadius;

    // Unmistakable central physical separation gap (35 mm)
    const gapMeters = 0.035;
    this.gapMeters = gapMeters;
    this.recoilBaseLift = 0.012; // 12mm elastic spring-back of upper crosshead

    // Coordinates for lower and upper break planes
    const lowerBreakY = breakCenterY - (gapMeters / 2);
    const upperBreakY = breakCenterY + (gapMeters / 2);

    const bottomGripY = -(this.gaugeLength_m / 2);
    const topGripY = (this.gaugeLength_m / 2) + elongationMeters;

    const lowerStemHeight = Math.max(0.04, lowerBreakY - bottomGripY);
    const upperStemHeight = Math.max(0.04, topGripY - upperBreakY);

    // 3. Lower Broken Half (Stationary grip up to lowerBreakY)
    const lowerStemGeo = new THREE.CylinderGeometry(neckRadius, baseRadius, lowerStemHeight, 32);
    this.lowerStem = new THREE.Mesh(lowerStemGeo, this.material);
    this.lowerStemBaseY = bottomGripY + (lowerStemHeight / 2);
    this.lowerStem.position.y = this.lowerStemBaseY;
    this.group.add(this.lowerStem);
    this.brokenPieces.push(this.lowerStem);

    // Lower fracture surface (Cup for mild steel or flat cleavage for cast iron)
    if (isMildSteel) {
      // Classic Ductile Cup with 45° shear lip
      const cupGeo = new THREE.ConeGeometry(neckRadius, neckRadius * 0.75, 24, 1, true);
      this.lowerCap = new THREE.Mesh(cupGeo, this.matFractureFace);
      this.lowerCap.rotation.x = Math.PI; // Inverted cone forming cup cavity
      this.lowerCapBaseY = lowerBreakY;
      this.lowerCap.position.y = this.lowerCapBaseY;
      this.group.add(this.lowerCap);
      this.brokenPieces.push(this.lowerCap);
    } else {
      // Brittle Flat 90° cleavage surface
      const flatGeo = new THREE.CylinderGeometry(neckRadius, neckRadius, 0.002, 24);
      this.lowerCap = new THREE.Mesh(flatGeo, this.matFractureFace);
      this.lowerCapBaseY = lowerBreakY;
      this.lowerCap.position.y = this.lowerCapBaseY;
      this.group.add(this.lowerCap);
      this.brokenPieces.push(this.lowerCap);
    }

    // 4. Upper Broken Half (From upperBreakY up to top grip)
    const upperStemGeo = new THREE.CylinderGeometry(baseRadius, neckRadius, upperStemHeight, 32);
    this.upperStem = new THREE.Mesh(upperStemGeo, this.material);
    this.upperStemBaseY = upperBreakY + (upperStemHeight / 2);
    this.upperStem.position.y = this.upperStemBaseY + this.recoilBaseLift;
    this.group.add(this.upperStem);
    this.brokenPieces.push(this.upperStem);

    // Upper fracture surface (Cone for mild steel or flat cleavage for cast iron)
    if (isMildSteel) {
      // Matching Ductile Cone fitting into the cup
      const coneGeo = new THREE.ConeGeometry(neckRadius * 0.94, neckRadius * 0.75, 24);
      this.upperCap = new THREE.Mesh(coneGeo, this.matFractureFace);
      this.upperCap.rotation.x = Math.PI; // Pointing down
      this.upperCapBaseY = upperBreakY;
      this.upperCap.position.y = this.upperCapBaseY + this.recoilBaseLift;
      this.group.add(this.upperCap);
      this.brokenPieces.push(this.upperCap);
    } else {
      // Matching Brittle Flat 90° cleavage disc
      const flatGeo = new THREE.CylinderGeometry(neckRadius, neckRadius, 0.002, 24);
      this.upperCap = new THREE.Mesh(flatGeo, this.matFractureFace);
      this.upperCapBaseY = upperBreakY;
      this.upperCap.position.y = this.upperCapBaseY + this.recoilBaseLift;
      this.group.add(this.upperCap);
      this.brokenPieces.push(this.upperCap);
    }

    // Move upper assembly with recoil lift
    if (this.upperAssembly) {
      this.upperAssembly.position.y = elongationMeters + this.recoilBaseLift;
    }

    // Gauge mark alerts
    if (this.topGaugeMark) this.topGaugeMark.material.color.setHex(0xdc2626);
    if (this.bottomGaugeMark) this.bottomGaugeMark.material.color.setHex(0xdc2626);

    // Trigger dynamic high-frequency elastic vibration recoil
    this.isRecoiling = true;
    this.recoilTime = 0.0;
  }

  updateConfig(diameter_mm, materialKey) {
    this.diameter_mm = diameter_mm;
    this.materialKey = materialKey;
    this.isFractured = false;
    this.isRecoiling = false;
    this.lastElongationMeters = 0.0;
    this.lastNeckProgress = 0.0;
    this.initMaterial();
    this.buildGeometry();
    this.setRestingOnBench();
  }

  bindEvents() {
    events.on('ROD_SELECTED', ({ diameter, material }) => {
      const matKey = (typeof material === 'object' ? material.id : material) || 'MILD_STEEL';
      this.updateConfig(diameter, matKey);
    });

    events.on('PHYSICS_TICK', ({ elongation_mm, strain, stage, neckProgress }) => {
      if (this.isMounted && !this.isFractured) {
        const isNecking = stage === 'necking';
        this.applyDeformation(elongation_mm, strain, isNecking, neckProgress || 0);
      }
    });

    // Listen for fracture from both Physics Engine and State Machine
    events.on('FRACTURE_OCCURRED', () => {
      this.triggerFracture();
    });

    events.on('STATE_CHANGED', ({ currentState }) => {
      if (currentState === 'STATE_11_FRACTURE' || currentState === 'STATE_12_FINAL_MEASUREMENT') {
        this.triggerFracture();
      }
    });

    events.on('RESET_EXPERIMENT', () => {
      this.isFractured = false;
      this.isRecoiling = false;
      this.lastElongationMeters = 0.0;
      this.lastNeckProgress = 0.0;
      this.buildGeometry();
      this.setRestingOnBench();
    });
  }
}
