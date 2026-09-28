import * as THREE from 'three';
import { events } from '../../core/EventBus.js';

export class UTMApparatus {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'UTMApparatusGroup';

    this.isClamped = false;
    this.clampProgress = 0; // 0 = open, 1 = clamped
    this.targetClampProgress = 0;
    this.crossheadBaseY = 1.50; // Initial upper crosshead Y position
    this.crossheadCurrentY = 1.50;

    this.initMaterials();
    this.initTextures();
    this.initBaseAndCylinder();
    this.initLowerTable();
    this.initColumnsAndLeadScrews();
    this.initMovingCrosshead();
    this.initTopCrosshead();
    this.initGrips();
    this.initHydraulicControlConsole();
    this.initHydraulicHoses();

    this.scene.add(this.group);
    this.bindEvents();
  }

  initMaterials() {
    // 1. Factory electrostatic industrial machine paint (Electrostatic off-white / light grey)
    this.matCastings = new THREE.MeshStandardMaterial({
      color: 0xe5eaf0,
      roughness: 0.38,
      metalness: 0.15
    });

    // 2. Iconic Indian/German UTM Industrial Royal Blue (Accents, base ring, door panel)
    this.matIndustrialBlue = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.35,
      metalness: 0.22
    });

    // 3. Mirror-polished hard chrome (Vertical columns, handwheel spokes, cylinder ram)
    this.matHardChrome = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.08,
      metalness: 0.96
    });

    // 4. Threaded precision steel lead screws
    this.matLeadScrew = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.35,
      metalness: 0.85
    });

    // 5. Heavy heat-treated wedge grip steel & knurled jaws
    this.matGrips = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.7
    });

    this.matJaws = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.3,
      metalness: 0.85
    });

    // 6. Corrugated rubber dust bellows (Under lower table around hydraulic ram)
    this.matBellows = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.92,
      metalness: 0.05
    });

    // 7. Control console casing & desk
    this.matConsoleCasing = new THREE.MeshStandardMaterial({
      color: 0xdee4ea,
      roughness: 0.42,
      metalness: 0.12
    });

    this.matConsoleDesk = new THREE.MeshStandardMaterial({
      color: 0xc8d1dc,
      roughness: 0.3,
      metalness: 0.25
    });

    // 8. Polished brass / gold valve trims & bushings
    this.matBrass = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.25,
      metalness: 0.85
    });
  }

  initTextures() {
    this.peakLoad_kN = 0.0;
    this.curvePoints = [];
    this.currentStatusText = 'READY / STANDBY';
    this.currentMaterialName = 'MILD STEEL (ASTM E8)';
    this.currentDiameter = 8.0;
    this.isFractured = false;
    this.lastRenderTime = 0;

    if (typeof document === 'undefined') return;

    // 1. Branding Badge Texture ("UNIVERSAL TUE-C-1000")
    this.badgeCanvas = document.createElement('canvas');
    this.badgeCanvas.width = 512;
    this.badgeCanvas.height = 256;
    const ctxB = this.badgeCanvas.getContext('2d');

    const gradB = ctxB.createLinearGradient(0, 0, 512, 256);
    gradB.addColorStop(0, '#1e40af');
    gradB.addColorStop(1, '#1d4ed8');
    ctxB.fillStyle = gradB;
    ctxB.fillRect(0, 0, 512, 256);

    ctxB.strokeStyle = '#60a5fa';
    ctxB.lineWidth = 6;
    ctxB.strokeRect(10, 10, 492, 236);

    ctxB.fillStyle = '#ffffff';
    ctxB.font = 'bold 54px Arial, sans-serif';
    ctxB.textAlign = 'center';
    ctxB.fillText('UNIVERSAL', 256, 85);

    ctxB.fillStyle = '#93c5fd';
    ctxB.font = 'bold 36px Arial, sans-serif';
    ctxB.fillText('TUE-C-1000', 256, 140);

    ctxB.fillStyle = '#e2e8f0';
    ctxB.font = '16px monospace';
    ctxB.fillText('SERVO-HYDRAULIC TESTING SYSTEM', 256, 180);
    ctxB.fillText('ISO 6892-1 • ASTM E8 • EN 10002', 256, 210);

    this.badgeTexture = new THREE.CanvasTexture(this.badgeCanvas);

    // 2. Microprocessor Digital Panel Canvas & Texture
    this.panelCanvas = document.createElement('canvas');
    this.panelCanvas.width = 512;
    this.panelCanvas.height = 256;
    this.ctxP = this.panelCanvas.getContext('2d');
    this.controllerTexture = new THREE.CanvasTexture(this.panelCanvas);

    // 3. Monitor Display Screen Canvas & Texture (Live Realtime Stress-Strain Graph)
    this.monCanvas = document.createElement('canvas');
    this.monCanvas.width = 512;
    this.monCanvas.height = 384;
    this.ctxM = this.monCanvas.getContext('2d');
    this.monitorTexture = new THREE.CanvasTexture(this.monCanvas);

    // Initial render of both active screens
    this.drawControllerScreen(0, 0, 0, 'READY / STANDBY');
    this.drawMonitorScreen(0, 0, 0, 0, 'READY / STANDBY');
  }

  drawControllerScreen(load_kN = 0, elong_mm = 0, stress_MPa = 0, status = 'READY') {
    if (!this.ctxP) return;
    const ctx = this.ctxP;

    // Dark industrial panel casing background
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, 512, 256);

    // LCD Screen Area (Deep emerald matrix)
    const sx = 16, sy = 16, sw = 265, sh = 224;
    ctx.fillStyle = '#022c22';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 3;
    ctx.strokeRect(sx, sy, sw, sh);

    // LCD Screen Header
    ctx.fillStyle = '#065f46';
    ctx.fillRect(sx + 2, sy + 2, sw - 4, 32);

    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('UNIVERSAL UTM-1000', sx + 12, sy + 23);

    // Digital Telemetry Readouts (High-contrast bright green LCD matrix with subtle glow)
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#34d399';

    ctx.font = 'bold 18px monospace';
    ctx.fillText('LOAD  : ' + load_kN.toFixed(2).padStart(7, ' ') + ' kN', sx + 12, sy + 68);
    ctx.fillText('DISP  : ' + elong_mm.toFixed(2).padStart(7, ' ') + ' mm', sx + 12, sy + 104);
    ctx.fillText('STRESS: ' + stress_MPa.toFixed(1).padStart(7, ' ') + ' MPa', sx + 12, sy + 140);
    ctx.fillText('PEAK  : ' + this.peakLoad_kN.toFixed(2).padStart(7, ' ') + ' kN', sx + 12, sy + 176);

    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = status.includes('FRACTUR') ? '#ef4444' : (status.includes('RUN') || status.includes('LOAD') ? '#38bdf8' : '#a7f3d0');
    ctx.fillText('STAT  : ' + status.substring(0, 16), sx + 12, sy + 210);

    ctx.shadowBlur = 0; // Reset shadow

    // Keypad Buttons Matrix on the Right Side
    const kx = 300, ky = 16;
    const btnW = 44, btnH = 48, gap = 8;
    const labels = [
      ['7', '8', '9', 'ESC'],
      ['4', '5', '6', 'TARE'],
      ['1', '2', '3', 'PEAK'],
      ['0', '.', 'RUN', 'STOP']
    ];

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const bx = kx + c * (btnW + gap);
        const by = ky + r * (btnH + gap);

        const lbl = labels[r][c];
        const isRun = lbl === 'RUN';
        const isStop = lbl === 'STOP';
        const isAction = lbl === 'TARE' || lbl === 'PEAK' || lbl === 'ESC';

        ctx.fillStyle = isRun ? '#15803d' : (isStop ? '#b91c1c' : (isAction ? '#1e3a8a' : '#1e293b'));
        ctx.fillRect(bx, by, btnW, btnH);

        ctx.strokeStyle = isRun ? '#22c55e' : (isStop ? '#ef4444' : '#334155');
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, btnW, btnH);

        ctx.fillStyle = '#f8fafc';
        ctx.font = lbl.length > 2 ? 'bold 11px Arial' : 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(lbl, bx + btnW / 2, by + btnH / 2 + 5);
      }
    }

    if (this.controllerTexture) {
      this.controllerTexture.needsUpdate = true;
    }
  }

  drawMonitorScreen(load_kN = 0, elong_mm = 0, stress_MPa = 0, strain = 0, status = 'READY') {
    if (!this.ctxM) return;
    const ctx = this.ctxM;

    // Deep industrial CAD monitor background
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, 512, 384);

    // 1. Top Header Bar
    ctx.fillStyle = '#0b1329';
    ctx.fillRect(0, 0, 512, 38);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 512, 38);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('📊 DAQ SYSTEM: ' + this.currentMaterialName + ' Ø ' + this.currentDiameter.toFixed(1) + ' mm', 14, 24);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('ASTM E8 / ISO 6892', 498, 24);

    // 2. Engineering Graph Frame & Grid
    const gx = 52, gy = 52, gw = 432, gh = 280;

    ctx.fillStyle = '#0a1022';
    ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeStyle = '#1e2d4a';
    ctx.lineWidth = 1;
    ctx.strokeRect(gx, gy, gw, gh);

    // Determine scale based on material
    const isCastIron = this.currentMaterialName.includes('CAST');
    const maxStrain = isCastIron ? 0.012 : 0.28;
    const maxStress = isCastIron ? 250 : 500;

    // Horizontal grid lines (Stress)
    ctx.strokeStyle = '#13213a';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';

    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const val = (maxStress / ySteps) * i;
      const y = gy + gh - (i / ySteps) * gh;
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx + gw, y);
      ctx.stroke();
      ctx.fillText(val.toFixed(0), gx - 6, y + 4);
    }

    // Vertical grid lines (Strain)
    ctx.textAlign = 'center';
    const xSteps = 5;
    for (let i = 0; i <= xSteps; i++) {
      const val = (maxStrain / xSteps) * i;
      const x = gx + (i / xSteps) * gw;
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x, gy + gh);
      ctx.stroke();
      ctx.fillText(val.toFixed(isCastIron ? 3 : 2), x, gy + gh + 14);
    }

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('STRESS σ (MPa)', gx + 8, gy + 18);
    ctx.textAlign = 'right';
    ctx.fillText('STRAIN ε', gx + gw - 8, gy + gh - 8);

    // 3. Plot Realtime Stress-Strain Curve from Telemetry History
    if (this.curvePoints.length > 1) {
      // Shaded area under the curve
      ctx.beginPath();
      const firstX = gx + Math.min(1.0, this.curvePoints[0].strain / maxStrain) * gw;
      ctx.moveTo(firstX, gy + gh);

      for (let i = 0; i < this.curvePoints.length; i++) {
        const pt = this.curvePoints[i];
        const px = gx + Math.min(1.0, Math.max(0, pt.strain / maxStrain)) * gw;
        const py = gy + gh - Math.min(1.0, Math.max(0, pt.stress / maxStress)) * gh;
        ctx.lineTo(px, py);
      }

      const lastX = gx + Math.min(1.0, this.curvePoints[this.curvePoints.length - 1].strain / maxStrain) * gw;
      ctx.lineTo(lastX, gy + gh);
      ctx.closePath();

      const fillGrad = ctx.createLinearGradient(0, gy, 0, gy + gh);
      fillGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
      fillGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Main vibrant cyan stress-strain line
      ctx.beginPath();
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < this.curvePoints.length; i++) {
        const pt = this.curvePoints[i];
        const px = gx + Math.min(1.0, Math.max(0, pt.strain / maxStrain)) * gw;
        const py = gy + gh - Math.min(1.0, Math.max(0, pt.stress / maxStress)) * gh;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Active leading tracking dot
      const lastPt = this.curvePoints[this.curvePoints.length - 1];
      const curX = gx + Math.min(1.0, Math.max(0, lastPt.strain / maxStrain)) * gw;
      const curY = gy + gh - Math.min(1.0, Math.max(0, lastPt.stress / maxStress)) * gh;

      if (!this.isFractured) {
        ctx.beginPath();
        ctx.fillStyle = '#60a5fa';
        ctx.arc(curX, curY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(curX, curY, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Red rupture marker
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(curX, curY, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('⚡ RUPTURE', curX + 10, curY - 6);
      }
    }

    // 4. Bottom Realtime Telemetry Status Bar
    ctx.fillStyle = '#0b1329';
    ctx.fillRect(0, 346, 512, 38);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 346, 512, 38);

    ctx.textAlign = 'left';
    ctx.font = 'bold 13px monospace';
    if (this.isFractured) {
      ctx.fillStyle = '#ef4444';
      ctx.fillText('● RUPTURED', 14, 370);
    } else if (status.includes('RUN') || status.includes('LOAD')) {
      ctx.fillStyle = '#22c55e';
      ctx.fillText('● ACQUIRING', 14, 370);
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('○ ' + status, 14, 370);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('F: ' + load_kN.toFixed(2) + ' kN  |  ΔL: ' + elong_mm.toFixed(2) + ' mm  |  σ: ' + stress_MPa.toFixed(1) + ' MPa', 498, 370);

    if (this.monitorTexture) {
      this.monitorTexture.needsUpdate = true;
    }
  }

  updateTelemetry(data) {
    if (!data) return;

    if (data.load_kN > this.peakLoad_kN) {
      this.peakLoad_kN = data.load_kN;
    }

    // Append curve point
    this.curvePoints.push({
      strain: data.strain || 0,
      stress: data.stress_MPa || 0
    });

    // Translate stage to human readable status
    let stageStr = 'TESTING';
    if (data.stage === 'elastic') stageStr = 'ELASTIC';
    else if (data.stage === 'yielding') stageStr = 'YIELDING';
    else if (data.stage === 'hardening') stageStr = 'HARDENING';
    else if (data.stage === 'ultimate') stageStr = 'UTS PEAK';
    else if (data.stage === 'necking') stageStr = 'NECKING';
    else if (data.stage === 'fracture') stageStr = 'FRACTURED';

    // Throttle canvas repainting to ~30-40ms (smooth 30fps screen updates without CPU overhead)
    const now = performance.now();
    if (now - this.lastRenderTime > 35 || data.isFractured) {
      this.lastRenderTime = now;
      this.drawControllerScreen(data.load_kN, data.elongation_mm, data.stress_MPa, stageStr);
      this.drawMonitorScreen(data.load_kN, data.elongation_mm, data.stress_MPa, data.strain, stageStr);
    }
  }

  resetTelemetry() {
    this.peakLoad_kN = 0.0;
    this.curvePoints = [];
    this.isFractured = false;
    this.drawControllerScreen(0, 0, 0, 'READY / STANDBY');
    this.drawMonitorScreen(0, 0, 0, 0, 'READY / STANDBY');
  }

  initBaseAndCylinder() {
    // 1. Heavy Foundation Base Plinth with floor anchoring ears (Width: 0.85m, Depth: 0.62m, Height: 0.16m)
    const plinthGeo = new THREE.BoxGeometry(0.85, 0.16, 0.62);
    const plinthMesh = new THREE.Mesh(plinthGeo, this.matCastings);
    plinthMesh.position.set(0, 0.08, 0);
    this.group.add(plinthMesh);

    // 4 Anchor bolt flanges on the corners
    const earGeo = new THREE.BoxGeometry(0.10, 0.06, 0.10);
    const boltGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.08, 16);
    const earPositions = [
      [-0.42, 0.03, -0.28],
      [0.42, 0.03, -0.28],
      [-0.42, 0.03, 0.28],
      [0.42, 0.03, 0.28]
    ];
    earPositions.forEach(([x, y, z]) => {
      const ear = new THREE.Mesh(earGeo, this.matCastings);
      ear.position.set(x, y, z);
      this.group.add(ear);

      const bolt = new THREE.Mesh(boltGeo, this.matLeadScrew);
      bolt.position.set(x, y + 0.04, z);
      this.group.add(bolt);
    });

    // 2. Central Massive Hydraulic Cylinder Casing (Diameter: 0.44m, Height: 0.50m)
    const cylGeo = new THREE.CylinderGeometry(0.22, 0.24, 0.50, 32);
    const cylMesh = new THREE.Mesh(cylGeo, this.matCastings);
    cylMesh.position.set(0, 0.41, 0);
    this.group.add(cylMesh);

    // Vertical structural stiffening ribs around the cylinder
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const ribGeo = new THREE.BoxGeometry(0.06, 0.44, 0.12);
      const rib = new THREE.Mesh(ribGeo, this.matCastings);
      rib.position.set(Math.cos(angle) * 0.24, 0.41, Math.sin(angle) * 0.24);
      rib.rotation.y = angle;
      this.group.add(rib);
    }

    // 3. Royal Blue Heavy Intermediate Flange Ring (Diameter: 0.52m, Height: 0.08m)
    const flangeGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.08, 32);
    const flangeMesh = new THREE.Mesh(flangeGeo, this.matIndustrialBlue);
    flangeMesh.position.set(0, 0.68, 0);
    this.group.add(flangeMesh);

    // Blue side column base support lugs
    const lugGeo = new THREE.BoxGeometry(0.18, 0.09, 0.32);
    const leftLug = new THREE.Mesh(lugGeo, this.matIndustrialBlue);
    leftLug.position.set(-0.25, 0.68, 0);
    this.group.add(leftLug);

    const rightLug = new THREE.Mesh(lugGeo, this.matIndustrialBlue);
    rightLug.position.set(0.25, 0.68, 0);
    this.group.add(rightLug);

    // 4. Black Corrugated Rubber Dust Boot / Bellows around Hydraulic Ram (Height: 0.12m)
    const bellowsGroup = new THREE.Group();
    bellowsGroup.position.set(0, 0.77, 0);
    for (let r = 0; r < 5; r++) {
      const ringRadius = 0.16 + (r % 2 === 0 ? 0.015 : 0);
      const ringTorus = new THREE.Mesh(
        new THREE.CylinderGeometry(ringRadius, ringRadius, 0.022, 28),
        this.matBellows
      );
      ringTorus.position.y = (r - 2) * 0.022;
      bellowsGroup.add(ringTorus);
    }
    this.group.add(bellowsGroup);
  }

  initLowerTable() {
    // Sculpted Cast Iron Lower Crosshead Table (Fixed Bed spanning between columns)
    this.lowerTableGroup = new THREE.Group();
    this.lowerTableGroup.position.set(0, 0.88, 0);

    // Center heavy block
    const tableBodyGeo = new THREE.BoxGeometry(0.58, 0.12, 0.36);
    const tableBody = new THREE.Mesh(tableBodyGeo, this.matCastings);
    this.lowerTableGroup.add(tableBody);

    // Chamfered front & rear wings
    const wingGeo = new THREE.BoxGeometry(0.54, 0.08, 0.08);
    const frontWing = new THREE.Mesh(wingGeo, this.matCastings);
    frontWing.position.set(0, -0.02, 0.20);
    this.lowerTableGroup.add(frontWing);

    const rearWing = new THREE.Mesh(wingGeo, this.matCastings);
    rearWing.position.set(0, -0.02, -0.20);
    this.lowerTableGroup.add(rearWing);

    // Royal Blue guide collars around the vertical columns
    const collarGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.14, 24);
    const leftCollar = new THREE.Mesh(collarGeo, this.matIndustrialBlue);
    leftCollar.position.set(-0.25, 0, 0);
    this.lowerTableGroup.add(leftCollar);

    const rightCollar = new THREE.Mesh(collarGeo, this.matIndustrialBlue);
    rightCollar.position.set(0.25, 0, 0);
    this.lowerTableGroup.add(rightCollar);

    this.group.add(this.lowerTableGroup);
  }

  initColumnsAndLeadScrews() {
    // 1. Massive Twin Polished Hard-Chrome Columns (Height: 1.45m, spaced 0.50m apart)
    const colRadius = 0.032;
    const colHeight = 1.45;
    const colGeo = new THREE.CylinderGeometry(colRadius, colRadius, colHeight, 32);

    this.leftCol = new THREE.Mesh(colGeo, this.matHardChrome);
    this.leftCol.position.set(-0.25, 1.54, 0);
    this.group.add(this.leftCol);

    this.rightCol = new THREE.Mesh(colGeo, this.matHardChrome);
    this.rightCol.position.set(0.25, 1.54, 0);
    this.group.add(this.rightCol);

    // Polished chrome column top bevel endcaps
    const capGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.03, 24);
    const leftCap = new THREE.Mesh(capGeo, this.matHardChrome);
    leftCap.position.set(-0.25, 2.27, 0);
    this.group.add(leftCap);

    const rightCap = new THREE.Mesh(capGeo, this.matHardChrome);
    rightCap.position.set(0.25, 2.27, 0);
    this.group.add(rightCap);

    // 2. Twin Precision Threaded Power Screws (Positioned slightly inward at X = ±0.17m)
    const screwRadius = 0.018;
    const screwHeight = 1.40;
    const screwGeo = new THREE.CylinderGeometry(screwRadius, screwRadius, screwHeight, 20);

    this.leftScrew = new THREE.Mesh(screwGeo, this.matLeadScrew);
    this.leftScrew.position.set(-0.16, 1.54, 0);
    this.group.add(this.leftScrew);

    this.rightScrew = new THREE.Mesh(screwGeo, this.matLeadScrew);
    this.rightScrew.position.set(0.16, 1.54, 0);
    this.group.add(this.rightScrew);

    // Add pitch rings along the screws for authentic threading look
    for (let y = 0.95; y <= 2.15; y += 0.04) {
      const ringGeo = new THREE.TorusGeometry(0.0185, 0.002, 6, 16);
      const ringL = new THREE.Mesh(ringGeo, this.matHardChrome);
      ringL.rotation.x = Math.PI / 2;
      ringL.position.set(-0.16, y, 0);
      this.group.add(ringL);

      const ringR = new THREE.Mesh(ringGeo, this.matHardChrome);
      ringR.rotation.x = Math.PI / 2;
      ringR.position.set(0.16, y, 0);
      this.group.add(ringR);
    }
  }

  initMovingCrosshead() {
    // Kinematic Moving Crosshead Group (Translates vertically under tension load)
    this.movingCrosshead = new THREE.Group();
    this.movingCrosshead.position.set(0, this.crossheadBaseY, 0);

    // 1. Sculpted Arched Crosshead Casting Body
    const centerBlockGeo = new THREE.BoxGeometry(0.38, 0.15, 0.32);
    const centerBlock = new THREE.Mesh(centerBlockGeo, this.matCastings);
    this.movingCrosshead.add(centerBlock);

    // Curved front arch nose
    const archNoseGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.15, 24, 1, false, 0, Math.PI);
    const archNose = new THREE.Mesh(archNoseGeo, this.matCastings);
    archNose.rotation.y = -Math.PI / 2;
    archNose.position.set(0, 0, 0.15);
    this.movingCrosshead.add(archNose);

    // Lateral wings connecting to guide columns
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.26), this.matCastings);
    wingL.position.set(-0.21, 0, 0);
    this.movingCrosshead.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.26), this.matCastings);
    wingR.position.set(0.21, 0, 0);
    this.movingCrosshead.add(wingR);

    // Guide Column sliding sleeve bushings
    const sleeveGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.17, 24);
    const leftSleeve = new THREE.Mesh(sleeveGeo, this.matCastings);
    leftSleeve.position.set(-0.25, 0, 0);
    this.movingCrosshead.add(leftSleeve);

    const rightSleeve = new THREE.Mesh(sleeveGeo, this.matCastings);
    rightSleeve.position.set(0.25, 0, 0);
    this.movingCrosshead.add(rightSleeve);

    // 2. Iconic 4-Spoke Chrome Manual Clamping Star Handwheel on Front Face
    this.starWheelGroup = new THREE.Group();
    this.starWheelGroup.position.set(0, 0, 0.26);

    const hubGeo = new THREE.CylinderGeometry(0.04, 0.042, 0.045, 24);
    const hub = new THREE.Mesh(hubGeo, this.matHardChrome);
    hub.rotation.x = Math.PI / 2;
    this.starWheelGroup.add(hub);

    // 4 spokes protruding outward
    const spokeGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.14, 16);
    const knobGeo = new THREE.SphereGeometry(0.014, 16, 16);

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const spoke = new THREE.Mesh(spokeGeo, this.matHardChrome);
      spoke.position.set(Math.cos(angle) * 0.075, Math.sin(angle) * 0.075, 0.008);
      spoke.rotation.z = angle - Math.PI / 2;
      this.starWheelGroup.add(spoke);

      const knob = new THREE.Mesh(knobGeo, this.matHardChrome);
      knob.position.set(Math.cos(angle) * 0.145, Math.sin(angle) * 0.145, 0.008);
      this.starWheelGroup.add(knob);
    }
    this.movingCrosshead.add(this.starWheelGroup);

    this.group.add(this.movingCrosshead);
  }

  initTopCrosshead() {
    // Fixed Top Arch Crosshead (Connects the top of the columns at Y = 2.22m)
    this.topCrossheadGroup = new THREE.Group();
    this.topCrossheadGroup.position.set(0, 2.22, 0);

    const topBeamGeo = new THREE.BoxGeometry(0.66, 0.12, 0.32);
    const topBeam = new THREE.Mesh(topBeamGeo, this.matCastings);
    this.topCrossheadGroup.add(topBeam);

    // Royal Blue top collar brackets
    const collarGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.13, 24);
    const leftCollar = new THREE.Mesh(collarGeo, this.matIndustrialBlue);
    leftCollar.position.set(-0.25, 0, 0);
    this.topCrossheadGroup.add(leftCollar);

    const rightCollar = new THREE.Mesh(collarGeo, this.matIndustrialBlue);
    rightCollar.position.set(0.25, 0, 0);
    this.topCrossheadGroup.add(rightCollar);

    // Center manual adjustment knob / spindle on top
    const glandGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.05, 20);
    const gland = new THREE.Mesh(glandGeo, this.matHardChrome);
    gland.position.set(0, 0.08, 0);
    this.topCrossheadGroup.add(gland);

    const topWheelGeo = new THREE.TorusGeometry(0.055, 0.008, 8, 24);
    const topWheel = new THREE.Mesh(topWheelGeo, this.matHardChrome);
    topWheel.rotation.x = Math.PI / 2;
    topWheel.position.set(0, 0.11, 0);
    this.topCrossheadGroup.add(topWheel);

    this.group.add(this.topCrossheadGroup);
  }

  initGrips() {
    // 1. Lower Stationary Wedge Grip Housing (Mounted on lower table, top face at exact Y = 1.00m)
    this.lowerGripHousing = new THREE.Group();
    this.lowerGripHousing.position.set(0, 0.93, 0);

    const gripBaseGeo = new THREE.CylinderGeometry(0.055, 0.048, 0.14, 24);
    const lowerBody = new THREE.Mesh(gripBaseGeo, this.matGrips);
    this.lowerGripHousing.add(lowerBody);

    // Lower Wedge Jaws (Left & Right, knurled surface facing specimen)
    const jawGeo = new THREE.BoxGeometry(0.016, 0.07, 0.035);
    this.lowerLeftJaw = new THREE.Mesh(jawGeo, this.matJaws);
    this.lowerLeftJaw.position.set(-0.022, 0.035, 0);
    this.lowerGripHousing.add(this.lowerLeftJaw);

    this.lowerRightJaw = new THREE.Mesh(jawGeo, this.matJaws);
    this.lowerRightJaw.position.set(0.022, 0.035, 0);
    this.lowerGripHousing.add(this.lowerRightJaw);

    this.group.add(this.lowerGripHousing);

    // 2. Upper Moving Wedge Grip Housing (Mounted under Moving Crosshead; bottom face at exact Y = 1.30m at rest)
    this.upperGripHousing = new THREE.Group();
    this.upperGripHousing.position.set(0, -0.13, 0);

    const upperBody = new THREE.Mesh(gripBaseGeo, this.matGrips);
    upperBody.rotation.x = Math.PI; // Inverted pointing downwards
    this.upperGripHousing.add(upperBody);

    this.upperLeftJaw = new THREE.Mesh(jawGeo, this.matJaws);
    this.upperLeftJaw.position.set(-0.022, -0.035, 0);
    this.upperGripHousing.add(this.upperLeftJaw);

    this.upperRightJaw = new THREE.Mesh(jawGeo, this.matJaws);
    this.upperRightJaw.position.set(0.022, -0.035, 0);
    this.upperGripHousing.add(this.upperRightJaw);

    this.movingCrosshead.add(this.upperGripHousing);
  }

  initHydraulicControlConsole() {
    // Standalone Hydraulic & Electronic Control Console Desk (Positioned beside the machine, exactly as in photo)
    this.consoleGroup = new THREE.Group();
    this.consoleGroup.position.set(0.72, 0, 0.06);
    this.consoleGroup.rotation.y = -0.25; // Angled 15° towards operator

    // 1. Lower Main Enclosure Cabinet (Off-white / light industrial grey)
    const cabGeo = new THREE.BoxGeometry(0.50, 0.82, 0.50);
    const cabinet = new THREE.Mesh(cabGeo, this.matConsoleCasing);
    cabinet.position.set(0, 0.41, 0);
    this.consoleGroup.add(cabinet);

    // Royal Blue Front Access Door Panel with Machine Branding
    const doorGeo = new THREE.BoxGeometry(0.38, 0.58, 0.02);
    const doorMat = this.badgeTexture 
      ? new THREE.MeshStandardMaterial({ map: this.badgeTexture, roughness: 0.35, metalness: 0.1 })
      : this.matIndustrialBlue;
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.38, 0.255);
    this.consoleGroup.add(door);

    // 2. Slanted Ergonomic Operator Control Desk Top
    const deskGeo = new THREE.BoxGeometry(0.52, 0.06, 0.52);
    const desk = new THREE.Mesh(deskGeo, this.matConsoleDesk);
    desk.position.set(0, 0.84, 0);
    this.consoleGroup.add(desk);

    // 3. Dual Hydraulic Flow Valves with Chrome Handwheels (Load control & return release)
    const valveBaseGeo = new THREE.CylinderGeometry(0.025, 0.028, 0.03, 16);
    const handwheelGeo = new THREE.TorusGeometry(0.032, 0.006, 8, 24);
    const spokeCrossGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.062, 8);

    // Left Valve (Return / Release)
    const valveL = new THREE.Mesh(valveBaseGeo, this.matBrass);
    valveL.position.set(-0.14, 0.88, 0.12);
    this.consoleGroup.add(valveL);

    this.wheelL = new THREE.Mesh(handwheelGeo, this.matHardChrome);
    this.wheelL.name = 'wheelReturn';
    this.wheelL.rotation.x = Math.PI / 2;
    this.wheelL.position.set(-0.14, 0.90, 0.12);
    const spokeL1 = new THREE.Mesh(spokeCrossGeo, this.matHardChrome);
    const spokeL2 = new THREE.Mesh(spokeCrossGeo, this.matHardChrome);
    spokeL2.rotation.y = Math.PI / 2;
    this.wheelL.add(spokeL1);
    this.wheelL.add(spokeL2);
    this.consoleGroup.add(this.wheelL);

    // Right Valve (Fine Load Control)
    const valveR = new THREE.Mesh(valveBaseGeo, this.matBrass);
    valveR.position.set(0.14, 0.88, 0.12);
    this.consoleGroup.add(valveR);

    this.wheelR = new THREE.Mesh(handwheelGeo, this.matHardChrome);
    this.wheelR.name = 'wheelFlow';
    this.wheelR.rotation.x = Math.PI / 2;
    this.wheelR.position.set(0.14, 0.90, 0.12);
    const spokeR1 = new THREE.Mesh(spokeCrossGeo, this.matHardChrome);
    const spokeR2 = new THREE.Mesh(spokeCrossGeo, this.matHardChrome);
    spokeR2.rotation.y = Math.PI / 2;
    this.wheelR.add(spokeR1);
    this.wheelR.add(spokeR2);
    this.consoleGroup.add(this.wheelR);

    // 4. Physical Interactive Industrial Pushbuttons on Console Desk
    const btnCollarGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.012, 20);
    const btnCapGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.012, 20);

    // A. EMERGENCY STOP (Large Red Mushroom Button with Hazard Yellow Collar)
    const estopBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.014, 24),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }) // Hazard yellow
    );
    estopBase.position.set(0, 0.88, 0.15);
    this.consoleGroup.add(estopBase);

    this.btnEstop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.016, 0.018, 24),
      new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.25,
        metalness: 0.1,
        emissive: 0x991b1b,
        emissiveIntensity: 0.2
      })
    );
    this.btnEstop.name = 'btnEstop';
    this.btnEstop.userData = { baseY: 0.898, isPressed: false };
    this.btnEstop.position.set(0, 0.898, 0.15);
    this.consoleGroup.add(this.btnEstop);

    // B. START TEST (Illuminated Green Pushbutton)
    const collarStart = new THREE.Mesh(btnCollarGeo, this.matHardChrome);
    collarStart.position.set(0.065, 0.88, 0.15);
    this.consoleGroup.add(collarStart);

    this.btnStart = new THREE.Mesh(
      btnCapGeo,
      new THREE.MeshStandardMaterial({
        color: 0x16a34a,
        roughness: 0.2,
        metalness: 0.1,
        emissive: 0x22c55e,
        emissiveIntensity: 0.45
      })
    );
    this.btnStart.name = 'btnStart';
    this.btnStart.userData = { baseY: 0.892, isPressed: false };
    this.btnStart.position.set(0.065, 0.892, 0.15);
    this.consoleGroup.add(this.btnStart);

    // C. TARE / ZERO TRANSDUCERS (Precision Blue Pushbutton)
    const collarTare = new THREE.Mesh(btnCollarGeo, this.matHardChrome);
    collarTare.position.set(-0.065, 0.88, 0.15);
    this.consoleGroup.add(collarTare);

    this.btnTare = new THREE.Mesh(
      btnCapGeo,
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.2,
        metalness: 0.1,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35
      })
    );
    this.btnTare.name = 'btnTare';
    this.btnTare.userData = { baseY: 0.892, isPressed: false };
    this.btnTare.position.set(-0.065, 0.892, 0.15);
    this.consoleGroup.add(this.btnTare);

    // D. RESET SIMULATION (Industrial Amber Pushbutton)
    const collarReset = new THREE.Mesh(btnCollarGeo, this.matHardChrome);
    collarReset.position.set(0.065, 0.88, 0.07);
    this.consoleGroup.add(collarReset);

    this.btnReset = new THREE.Mesh(
      btnCapGeo,
      new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.25,
        metalness: 0.1,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.3
      })
    );
    this.btnReset.name = 'btnReset';
    this.btnReset.userData = { baseY: 0.892, isPressed: false };
    this.btnReset.position.set(0.065, 0.892, 0.07);
    this.consoleGroup.add(this.btnReset);

    // Register active interactive desk controls for 3D raycasting
    this.interactiveControls = [
      this.btnEstop,
      this.btnStart,
      this.btnTare,
      this.btnReset,
      this.wheelL,
      this.wheelR
    ];

    // 4. Microprocessor Digital Load/Displacement Controller Unit (Sleek casing on all sides)
    const controllerGeo = new THREE.BoxGeometry(0.36, 0.14, 0.18);
    const controller = new THREE.Mesh(controllerGeo, this.matConsoleCasing);
    controller.position.set(0, 0.95, -0.06);
    controller.rotation.x = -0.15; // Tilted towards operator
    this.consoleGroup.add(controller);

    // Front Display Screen Face (Mounted exclusively on front face, completely eliminating texture leak onto sides)
    const faceGeo = new THREE.PlaneGeometry(0.35, 0.13);
    const faceMat = this.controllerTexture
      ? new THREE.MeshBasicMaterial({ map: this.controllerTexture })
      : new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const faceMesh = new THREE.Mesh(faceGeo, faceMat);
    faceMesh.position.set(0, 0, 0.091); // Front plane
    controller.add(faceMesh);

    // 5. Heavy-Gauge Metal Tubing Support Rack Frame for Upper Shelves
    const tubeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.65, 16);
    const postL = new THREE.Mesh(tubeGeo, this.matHardChrome);
    postL.position.set(-0.21, 1.20, -0.14);
    this.consoleGroup.add(postL);

    const postR = new THREE.Mesh(tubeGeo, this.matHardChrome);
    postR.position.set(0.21, 1.20, -0.14);
    this.consoleGroup.add(postR);

    // Intermediate Shelf (Holds Monitor & PC Tower)
    const shelf1 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.02, 0.32), this.matConsoleDesk);
    shelf1.position.set(0, 1.12, -0.04);
    this.consoleGroup.add(shelf1);

    // Topmost Shelf (Holds Report/Strip Chart Printer)
    const shelf2 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.02, 0.28), this.matConsoleDesk);
    shelf2.position.set(0, 1.48, -0.06);
    this.consoleGroup.add(shelf2);

    // 6. CRT / LCD Industrial Computer Display Unit
    const monBodyGeo = new THREE.BoxGeometry(0.24, 0.22, 0.14);
    const monBody = new THREE.Mesh(monBodyGeo, this.matConsoleCasing);
    monBody.position.set(-0.09, 1.25, -0.04);
    this.consoleGroup.add(monBody);

    const monScreenGeo = new THREE.PlaneGeometry(0.20, 0.16);
    const monScreenMat = this.monitorTexture
      ? new THREE.MeshBasicMaterial({ map: this.monitorTexture })
      : new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const monScreen = new THREE.Mesh(monScreenGeo, monScreenMat);
    monScreen.position.set(-0.09, 1.25, 0.032);
    this.consoleGroup.add(monScreen);

    // 7. Desktop PC Tower Unit on Shelf
    const pcGeo = new THREE.BoxGeometry(0.12, 0.24, 0.24);
    const pcTower = new THREE.Mesh(pcGeo, this.matConsoleCasing);
    pcTower.position.set(0.14, 1.25, -0.04);
    this.consoleGroup.add(pcTower);

    // 8. Industrial Report / Chart Printer on Top Shelf
    const printerGeo = new THREE.BoxGeometry(0.24, 0.10, 0.18);
    const printer = new THREE.Mesh(printerGeo, this.matConsoleCasing);
    printer.position.set(0.08, 1.54, -0.06);
    this.consoleGroup.add(printer);

    this.group.add(this.consoleGroup);
  }

  initHydraulicHoses() {
    // 4 High-Pressure Flexible Reinforced Hydraulic Hoses linking Machine Base to Console
    this.matHose = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,       // Deep hydraulic hose blue
      roughness: 0.6,
      metalness: 0.2
    });

    const hoseStartPoints = [
      new THREE.Vector3(0.22, 0.40, 0.05),
      new THREE.Vector3(0.22, 0.45, -0.02),
      new THREE.Vector3(0.22, 0.50, 0.04),
      new THREE.Vector3(0.22, 0.55, -0.04)
    ];

    const hoseEndPoints = [
      new THREE.Vector3(0.52, 0.32, 0.05),
      new THREE.Vector3(0.52, 0.37, 0.01),
      new THREE.Vector3(0.52, 0.42, 0.06),
      new THREE.Vector3(0.52, 0.47, -0.01)
    ];

    hoseStartPoints.forEach((p0, idx) => {
      const p1 = hoseEndPoints[idx];
      const mid = p0.clone().lerp(p1, 0.5).add(new THREE.Vector3(0, -0.08 - idx * 0.02, 0.08));

      const curve = new THREE.QuadraticBezierCurve3(p0, mid, p1);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.007, 8, false);
      const hoseMesh = new THREE.Mesh(tubeGeo, this.matHose);
      this.group.add(hoseMesh);
    });
  }

  clampGrips(clamp = true) {
    this.isClamped = clamp;
    this.targetClampProgress = clamp ? 1.0 : 0.0;
  }

  setDisplacement(elongation_mm) {
    // Convert mm to world coordinate meters: 1 mm elongation = 0.001 m crosshead displacement
    const displacementMeters = (elongation_mm || 0) * 0.001;
    this.crossheadCurrentY = this.crossheadBaseY + displacementMeters;
    this.movingCrosshead.position.y = this.crossheadCurrentY;

    // Smooth mechanical rotation of lead screws
    const rotSpeed = displacementMeters * 60;
    this.leftScrew.rotation.y = rotSpeed;
    this.rightScrew.rotation.y = -rotSpeed;
  }

  update(delta = 0.016) {
    // Smooth jaw clamping animation and synchronized star wheel rotation
    if (Math.abs(this.clampProgress - this.targetClampProgress) > 0.005) {
      this.clampProgress += (this.targetClampProgress - this.clampProgress) * 0.15;

      // Jaws open gap: 0.022m (open) down to 0.006m (clamped on rod)
      const openOffset = 0.022;
      const clampedOffset = 0.006;
      const currentOffset = openOffset - (openOffset - clampedOffset) * this.clampProgress;

      this.lowerLeftJaw.position.x = -currentOffset;
      this.lowerRightJaw.position.x = currentOffset;
      this.upperLeftJaw.position.x = -currentOffset;
      this.upperRightJaw.position.x = currentOffset;

      // Rotate the 4-spoke star wheel realistically as grips clamp/unclamp
      if (this.starWheelGroup) {
        this.starWheelGroup.rotation.z = this.clampProgress * Math.PI * 1.5;
      }
    }
  }

  pressButton(buttonMesh, onComplete) {
    if (!buttonMesh || buttonMesh.userData.isPressed) return;
    buttonMesh.userData.isPressed = true;
    const originalY = buttonMesh.userData.baseY !== undefined ? buttonMesh.userData.baseY : buttonMesh.position.y;
    buttonMesh.position.y = originalY - 0.005; // Depress 5mm into collar

    setTimeout(() => {
      buttonMesh.position.y = originalY;
      buttonMesh.userData.isPressed = false;
      if (onComplete) onComplete();
    }, 140);
  }

  turnValveWheel(wheelMesh, angleDelta = Math.PI / 4) {
    if (!wheelMesh) return;
    wheelMesh.rotation.z += angleDelta;
  }

  bindEvents() {
    events.on('SPECIMEN_MOUNTED', () => {
      this.clampGrips(true);
      this.drawControllerScreen(0, 0, 0, 'CLAMPED');
      this.drawMonitorScreen(0, 0, 0, 0, 'SPECIMEN CLAMPED');
    });

    events.on('TRANSDUCERS_TARED', () => {
      this.resetTelemetry();
      this.drawControllerScreen(0, 0, 0, 'TARED 0.00');
      this.drawMonitorScreen(0, 0, 0, 0, 'SENSORS TARED - ARMED');
    });

    events.on('ROD_SELECTED', ({ diameter, material }) => {
      this.currentDiameter = diameter;
      this.currentMaterialName = (material && material.name) ? material.name : 'MILD STEEL';
      this.resetTelemetry();
    });

    events.on('PHYSICS_TICK', (data) => {
      this.setDisplacement(data.elongation_mm);
      this.updateTelemetry(data);
    });

    events.on('FRACTURE_OCCURRED', () => {
      this.isFractured = true;
      const lastPoint = this.curvePoints[this.curvePoints.length - 1] || { strain: 0, stress: 0 };
      this.drawControllerScreen(0, lastPoint.strain * 300, 0, 'FRACTURED');
      this.drawMonitorScreen(0, lastPoint.strain * 300, 0, lastPoint.strain, 'SPECIMEN FRACTURED');
    });

    events.on('RESET_EXPERIMENT', () => {
      this.clampGrips(false);
      this.setDisplacement(0);
      this.resetTelemetry();
    });

    events.on('EMERGENCY_STOP', () => {
      const lastPoint = this.curvePoints[this.curvePoints.length - 1] || { strain: 0, stress: 0 };
      this.drawControllerScreen(0, lastPoint.strain * 300, 0, 'E-STOP TRIPPED');
      this.drawMonitorScreen(0, lastPoint.strain * 300, 0, lastPoint.strain, 'EMERGENCY STOP ACTIVATED');
    });
  }
}
