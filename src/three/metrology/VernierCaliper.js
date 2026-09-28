import * as THREE from 'three';
import { events } from '../../core/EventBus.js';

export class VernierCaliper {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'VernierCaliperGroup';

    // Metrology state
    this.jawOpening_mm = 0;       // Current opening in mm (0 to 150)
    this.maxOpening_mm = 150;
    this.scaleFactor = 0.001;     // 1 mm = 0.001 m in 3D world units
    this.currentReading = 0.0;
    this.isPickedUp = false;

    // Bench rest position (On felt pad next to specimen)
    this.benchPosition = new THREE.Vector3(-0.95, 0.858, 0.18);

    this.initMaterials();
    this.buildMainBeam();
    this.buildSlidingJaw();
    this.initLoupeRenderer();

    this.setRestingOnBench();
    this.scene.add(this.group);
    this.bindEvents();
  }

  initMaterials() {
    // Brushed surgical-grade stainless steel
    this.matSteel = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,       // Slate-300 bright steel
      metalness: 0.85,
      roughness: 0.25
    });

    this.matBevel = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,       // Satin finish on scale recesses
      metalness: 0.7,
      roughness: 0.4
    });

    this.matThumbWheel = new THREE.MeshStandardMaterial({
      color: 0x64748b,       // Knurled thumb roller
      metalness: 0.8,
      roughness: 0.5
    });

    this.matLockScrew = new THREE.MeshStandardMaterial({
      color: 0x475569,       // Brass/dark knurled screw
      metalness: 0.9,
      roughness: 0.3
    });
  }

  buildMainBeam() {
    this.mainBeamGroup = new THREE.Group();

    // 1. Main Graduated Rule Beam (Length: 220mm, Height: 16mm, Thickness: 3.5mm)
    const beamGeo = new THREE.BoxGeometry(0.22, 0.016, 0.0035);
    const beamMesh = new THREE.Mesh(beamGeo, this.matSteel);
    beamMesh.position.set(0.11, 0, 0);
    this.mainBeamGroup.add(beamMesh);

    // 2. Fixed Outside Measuring Jaw (Extending downward 40mm)
    const jawShape = new THREE.Shape();
    jawShape.moveTo(0, 0.008);
    jawShape.lineTo(0, -0.042);
    jawShape.lineTo(0.006, -0.042);
    jawShape.lineTo(0.018, -0.008);
    jawShape.lineTo(0.018, 0.008);
    jawShape.closePath();

    const extrudeSettings = { depth: 0.0035, bevelEnabled: false };
    const jawGeo = new THREE.ExtrudeGeometry(jawShape, extrudeSettings);
    const fixedJawMesh = new THREE.Mesh(jawGeo, this.matSteel);
    fixedJawMesh.position.set(0, 0, -0.00175);
    this.mainBeamGroup.add(fixedJawMesh);

    // 3. Fixed Inside Measuring Nib (Extending upward 20mm)
    const nibShape = new THREE.Shape();
    nibShape.moveTo(0, 0.008);
    nibShape.lineTo(0, 0.024);
    nibShape.lineTo(0.005, 0.024);
    nibShape.lineTo(0.014, 0.008);
    nibShape.closePath();

    const nibGeo = new THREE.ExtrudeGeometry(nibShape, extrudeSettings);
    const fixedNibMesh = new THREE.Mesh(nibGeo, this.matSteel);
    fixedNibMesh.position.set(0, 0, -0.00175);
    this.mainBeamGroup.add(fixedNibMesh);

    this.group.add(this.mainBeamGroup);
  }

  buildSlidingJaw() {
    this.sliderGroup = new THREE.Group();

    // 1. Sliding Cursor Frame (Sleeves around the main beam)
    const cursorGeo = new THREE.BoxGeometry(0.042, 0.026, 0.007);
    const cursorMesh = new THREE.Mesh(cursorGeo, this.matBevel);
    cursorMesh.position.set(0.021, 0, 0);
    this.sliderGroup.add(cursorMesh);

    // 2. Movable Outside Measuring Jaw (Extending downward parallel to fixed jaw)
    const jawShape = new THREE.Shape();
    jawShape.moveTo(0, 0.008);
    jawShape.lineTo(0, -0.042);
    jawShape.lineTo(-0.006, -0.042);
    jawShape.lineTo(-0.018, -0.008);
    jawShape.lineTo(-0.018, 0.008);
    jawShape.closePath();

    const extrudeSettings = { depth: 0.0035, bevelEnabled: false };
    const movableJawGeo = new THREE.ExtrudeGeometry(jawShape, extrudeSettings);
    const movableJawMesh = new THREE.Mesh(movableJawGeo, this.matSteel);
    movableJawMesh.position.set(0, 0, -0.00175);
    this.sliderGroup.add(movableJawMesh);

    // 3. Movable Inside Measuring Nib (Extending upward)
    const nibShape = new THREE.Shape();
    nibShape.moveTo(0, 0.008);
    nibShape.lineTo(0, 0.024);
    nibShape.lineTo(-0.005, 0.024);
    nibShape.lineTo(-0.014, 0.008);
    nibShape.closePath();

    const movableNibGeo = new THREE.ExtrudeGeometry(nibShape, extrudeSettings);
    const movableNibMesh = new THREE.Mesh(movableNibGeo, this.matSteel);
    movableNibMesh.position.set(0, 0, -0.00175);
    this.sliderGroup.add(movableNibMesh);

    // 4. Knurled Thumb Wheel (Bottom of slider)
    const thumbGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.006, 16);
    const thumbMesh = new THREE.Mesh(thumbGeo, this.matThumbWheel);
    thumbMesh.rotation.z = Math.PI / 2;
    thumbMesh.position.set(0.038, -0.012, 0);
    this.sliderGroup.add(thumbMesh);

    // 5. Locking Screw (Top of slider)
    const screwGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.005, 12);
    const screwMesh = new THREE.Mesh(screwGeo, this.matLockScrew);
    screwMesh.position.set(0.022, 0.015, 0);
    this.sliderGroup.add(screwMesh);

    this.group.add(this.sliderGroup);
    this.setOpening(0);
  }

  setOpening(mm) {
    this.jawOpening_mm = Math.max(0, Math.min(this.maxOpening_mm, mm));
    // Translate slider along X-axis
    this.sliderGroup.position.x = this.jawOpening_mm * this.scaleFactor;

    // Simulate standard metric vernier reading with slight realistic human alignment tolerance
    const simulatedError = (Math.random() - 0.5) * 0.04; // ±0.02mm error
    const rawVal = this.jawOpening_mm + (this.jawOpening_mm > 0 ? simulatedError : 0);
    // Align to 0.02mm least count
    this.currentReading = Math.max(0, Math.round(rawVal / 0.02) * 0.02);

    this.updateLoupeCanvas();

    events.emit('CALIPER_MOVED', {
      jawOpening_mm: this.jawOpening_mm,
      reading_mm: this.currentReading.toFixed(2)
    });
  }

  initLoupeRenderer() {
    this.loupeCanvas = document.getElementById('loupe-canvas');
    if (!this.loupeCanvas) return;
    this.loupeCtx = this.loupeCanvas.getContext('2d');
    this.loupeCanvas.width = 300;
    this.loupeCanvas.height = 80;
  }

  updateLoupeCanvas() {
    if (!this.loupeCtx) {
      this.initLoupeRenderer();
      if (!this.loupeCtx) return;
    }

    const ctx = this.loupeCtx;
    const w = this.loupeCanvas.width;
    const h = this.loupeCanvas.height;

    // Clear background (Clean satin steel plate)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Draw Main Scale (Top half: 1mm ticks)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;

    const pxPerMm = 12; // 12 pixels per mm for 4x optical magnification
    const zeroX = 60;
    const offset = this.jawOpening_mm * pxPerMm;

    // Draw main scale ticks
    ctx.font = '9px "Manrope", sans-serif';
    ctx.textAlign = 'center';

    for (let mm = 0; mm <= 25; mm++) {
      const x = zeroX + mm * pxPerMm;
      if (x < 0 || x > w) continue;

      let tickHeight = 10;
      if (mm % 10 === 0) {
        tickHeight = 22;
        ctx.fillText(mm.toString(), x, 28);
      } else if (mm % 5 === 0) {
        tickHeight = 16;
      }

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, tickHeight);
      ctx.stroke();
    }

    // Horizontal divider line
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(w, 40);
    ctx.stroke();

    // Draw Sliding Vernier Scale (Bottom half: 50 divisions = 49mm, least count = 0.02)
    const vernierZeroX = zeroX + offset;
    ctx.strokeStyle = '#0284c7';
    ctx.fillStyle = '#0284c7';

    // 50 vernier divisions spanning 49 main scale mm
    for (let div = 0; div <= 50; div += 5) {
      const vMm = div * 0.02; // Millimeters represented
      const vPixel = div * (49 / 50) * (pxPerMm / 1); // 0.98 * pxPerMm
      const x = vernierZeroX + vPixel;
      if (x < 0 || x > w) continue;

      const tickH = div % 10 === 0 ? 18 : 12;
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, 40 + tickH);
      ctx.stroke();

      if (div % 10 === 0) {
        ctx.fillText((div / 5).toString(), x, 72); // 0, 2, 4, 6, 8, 10
      }
    }

    // Update readout HUD
    const readingElem = document.getElementById('caliper-live-reading');
    if (readingElem) {
      readingElem.textContent = `${this.currentReading.toFixed(2)} mm`;
    }
  }

  setRestingOnBench() {
    this.isPickedUp = false;
    this.isMeasuring = false;
    this.isTransitioning = false;
    // Lie flat on the felt inspection pad slightly offset from specimen
    this.group.rotation.set(-Math.PI / 2, 0, 0);
    this.group.position.copy(this.benchPosition);
    this.setOpening(0);
  }

  measureDiameter(diameter_mm, specimenPos = null) {
    this.isPickedUp = true;
    this.isMeasuring = true;
    const target = specimenPos || new THREE.Vector3(-0.95, 0.865, 0);
    const radiusMeters = (diameter_mm / 2) * 0.001;

    this.targetPos = new THREE.Vector3(target.x - radiusMeters, target.y + 0.003, target.z + 0.025);
    this.targetOpening = diameter_mm;
    this.isTransitioning = true;
    this.group.rotation.set(-Math.PI / 2, 0, 0);
  }

  update(delta = 0.016) {
    if (this.isTransitioning && this.targetPos) {
      this.group.position.lerp(this.targetPos, 0.15);
      const diff = this.targetOpening - this.jawOpening_mm;
      if (Math.abs(diff) > 0.05) {
        this.setOpening(this.jawOpening_mm + diff * 0.2);
      } else {
        this.setOpening(this.targetOpening);
        if (this.group.position.distanceTo(this.targetPos) < 0.002) {
          this.group.position.copy(this.targetPos);
          this.isTransitioning = false;
        }
      }
    }
  }

  measureGaugeLength(length_mm) {
    this.isPickedUp = true;
    this.setOpening(Math.min(150, length_mm / 2)); // Caliper scale representation
  }

  bindEvents() {
    events.on('ROD_SELECTED', ({ diameter }) => {
      // Caliper ready for measurement
      this.setOpening(0);
    });

    events.on('RESET_EXPERIMENT', () => {
      this.setOpening(0);
      this.setRestingOnBench();
    });
  }
}
