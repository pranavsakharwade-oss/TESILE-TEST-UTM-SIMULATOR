import { SceneManager, CAMERA_PRESETS } from './three/SceneManager.js';
import { Environment } from './three/Environment.js';
import { UTMApparatus } from './three/apparatus/UTMApparatus.js';
import { SpecimenModel } from './three/specimen/SpecimenModel.js';
import { VernierCaliper } from './three/metrology/VernierCaliper.js';
import { InteractionManager } from './three/InteractionManager.js';
import { TensileEngine } from './physics/TensileEngine.js';
import { RealtimeCharts } from './ui/RealtimeCharts.js';
import { LabReportModal } from './ui/LabReportModal.js';
import { audioSynthesizer } from './audio/AudioSynthesizer.js';
import { stateMachine, LAB_STATES } from './core/StateMachine.js';
import { events } from './core/EventBus.js';
import { MATERIALS, getMatchedUTMCapacity } from './physics/MaterialConstants.js';

class Application {
  constructor() {
    this.selectedMaterial = 'MILD_STEEL';
    this.selectedRod = 8;
    this.initialMeasurements = {
      diameter_mm: 8.0,
      area_mm2: 50.27,
      gaugeLength_mm: 300.0
    };
    this.postFractureMeasurements = null;

    this.tensileEngine = new TensileEngine();
    this.realtimeCharts = new RealtimeCharts();
    this.labReportModal = new LabReportModal();

    this.initThree();
    this.initUI();
    this.bindEvents();
    this.selectMaterial('MILD_STEEL');
    console.log('🚀 UTM Tensile Test Simulation initialized.');
  }

  initThree() {
    const canvasContainer = document.getElementById('viewport-canvas-container');
    this.sceneManager = new SceneManager(canvasContainer);
    this.environment = new Environment(this.sceneManager.scene);

    // Apparatus, Specimen, and Metrology 3D Models
    this.utmApparatus = new UTMApparatus(this.sceneManager.scene);
    this.specimen = new SpecimenModel(this.sceneManager.scene, this.selectedRod, this.selectedMaterial);
    this.caliper = new VernierCaliper(this.sceneManager.scene);

    // 3D Raycasting & Interaction Manager
    this.interactionManager = new InteractionManager(
      this.sceneManager,
      this.specimen,
      this.caliper,
      this.utmApparatus,
      this.environment,
      this
    );

    // Register apparatus, specimen, caliper, and physics animation loop
    let lastTime = performance.now();
    this.sceneManager.registerAnimationCallback(() => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      this.utmApparatus.update(dt);
      this.specimen.update(dt);
      this.caliper.update(dt);
      this.tensileEngine.update(dt);
    });
  }

  initUI() {
    // 1. Camera View Buttons
    const camButtons = document.querySelectorAll('.cam-view-btn');
    camButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const viewKey = btn.dataset.view;
        camButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.sceneManager.setCameraPreset(viewKey);

        // If user manually clicks Metrology Bench view during pre-test, open measurement
        if (viewKey === 'METROLOGY_BENCH' && !this.tensileEngine.isRunning && !this.tensileEngine.isFractured) {
          if (stateMachine.getState() === LAB_STATES.STATE_2_SPECIMEN_INSPECTION) {
            this.startCaliperMeasurement();
          }
        }
      });
    });

    // Keyboard shortcuts for camera views
    window.addEventListener('keydown', (e) => {
      if (e.key === '1') {
        this.setCameraView('OVERVIEW');
      } else if (e.key === '2') {
        this.setCameraView('UTM_GRIPS');
      } else if (e.key === '3') {
        this.setCameraView('METROLOGY_BENCH');
        if (stateMachine.getState() === LAB_STATES.STATE_2_SPECIMEN_INSPECTION) {
          this.startCaliperMeasurement();
        }
      } else if (e.key === '4') {
        this.setCameraView('CONSOLE_MONITOR');
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.triggerEmergencyStop();
      }
    });

    // 2. Mode Switch (Guided vs Assessment)
    const guidedBtn = document.getElementById('mode-guided-btn');
    const assessBtn = document.getElementById('mode-assess-btn');

    guidedBtn.addEventListener('click', () => {
      guidedBtn.classList.add('active');
      assessBtn.classList.remove('active');
      stateMachine.setMode('guided');
    });

    assessBtn.addEventListener('click', () => {
      assessBtn.classList.add('active');
      guidedBtn.classList.remove('active');
      stateMachine.setMode('assessment');
    });

    // 3. Material Selection (Mild Steel vs Grey Cast Iron)
    const matSteelBtn = document.getElementById('mat-steel-btn');
    const matIronBtn = document.getElementById('mat-iron-btn');

    matSteelBtn.addEventListener('click', () => {
      if (this.tensileEngine.isRunning) return;
      this.selectMaterial('MILD_STEEL');
    });

    matIronBtn.addEventListener('click', () => {
      if (this.tensileEngine.isRunning) return;
      this.selectMaterial('GREY_CAST_IRON');
    });

    // 4. Rod Selection Cards
    const rodCards = document.querySelectorAll('.specimen-card');
    rodCards.forEach(card => {
      card.addEventListener('click', () => {
        if (this.tensileEngine.isRunning) return;
        const rodDiameter = parseInt(card.dataset.rod, 10);
        this.selectRod(rodDiameter);
      });
    });

    // 5. Control Console Buttons
    const recordBtn = document.getElementById('btn-measure-record');
    recordBtn.addEventListener('click', () => this.handleRecordButtonClick());

    const tareBtn = document.getElementById('btn-tare');
    tareBtn.addEventListener('click', () => this.zeroTareTransducers());

    const startBtn = document.getElementById('btn-start-test');
    startBtn.addEventListener('click', () => this.startTensileTest());

    document.getElementById('btn-estop').addEventListener('click', () => this.triggerEmergencyStop());
    document.getElementById('btn-reset').addEventListener('click', () => this.resetSimulation());
  }

  setCameraView(viewKey) {
    const btn = document.querySelector(`.cam-view-btn[data-view="${viewKey}"]`);
    if (btn) {
      document.querySelectorAll('.cam-view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    this.sceneManager.setCameraPreset(viewKey);
  }

  selectMaterial(materialId) {
    this.selectedMaterial = materialId;
    const mat = MATERIALS[materialId];

    // Update UI tabs
    const matSteelBtn = document.getElementById('mat-steel-btn');
    const matIronBtn = document.getElementById('mat-iron-btn');
    const materialBadge = document.getElementById('material-badge');
    const standardVal = document.getElementById('meta-standard-val');

    matSteelBtn.classList.toggle('active', materialId === 'MILD_STEEL');
    matIronBtn.classList.toggle('active', materialId === 'GREY_CAST_IRON');

    materialBadge.textContent = `${mat.name} (${mat.type})`;
    if (standardVal) {
      standardVal.textContent = materialId === 'MILD_STEEL' ? 'ASTM E8 Cylindrical' : 'ASTM A48 Class 30';
    }

    // Re-evaluate current rod under new material
    this.selectRod(this.selectedRod);
  }

  selectRod(diameter) {
    this.selectedRod = diameter;
    const mat = MATERIALS[this.selectedMaterial];

    // Update active card styling
    document.querySelectorAll('.specimen-card').forEach(card => {
      card.classList.toggle('active', parseInt(card.dataset.rod, 10) === diameter);
    });

    // Auto-populate matched UTM machine capacity based on diameter & material
    const matchedUTM = getMatchedUTMCapacity(diameter, this.selectedMaterial);
    const capacityVal = document.getElementById('machine-capacity-val');
    const driveVal = document.getElementById('machine-drive-val');
    const appVal = document.getElementById('machine-app-val');

    capacityVal.textContent = `${matchedUTM.capacity_kN} kN (${matchedUTM.capacityTons} Tons)`;
    driveVal.textContent = matchedUTM.driveType;
    appVal.textContent = matchedUTM.application;

    // Update Initial Dimensions
    const area = (Math.PI / 4) * Math.pow(diameter, 2);
    this.initialMeasurements = {
      diameter_mm: diameter,
      area_mm2: area,
      gaugeLength_mm: 300.0
    };

    const metaDia = document.getElementById('meta-dia-val');
    const metaArea = document.getElementById('meta-area-val');
    if (metaDia) metaDia.textContent = `${diameter.toFixed(2)} mm`;
    if (metaArea) metaArea.textContent = `${area.toFixed(2)} mm²`;

    events.emit('ROD_SELECTED', {
      diameter,
      gaugeLength: 300,
      material: mat,
      matchedUTM
    });

    // Reset specimen back onto bench
    this.specimen.setRestingOnBench();
    this.caliper.setRestingOnBench();
    const loupePod = document.getElementById('caliper-loupe-pod');
    if (loupePod) loupePod.classList.remove('visible');

    // Transition to inspection state
    stateMachine.transition(LAB_STATES.STATE_2_SPECIMEN_INSPECTION, {
      diameter,
      material: mat.name
    });

    // Zoom to workbench to see specimen and caliper
    this.setCameraView('METROLOGY_BENCH');

    // Arm the measure button
    const recordBtn = document.getElementById('btn-measure-record');
    if (recordBtn) {
      recordBtn.disabled = false;
      recordBtn.dataset.tooltip = 'Measure Specimen (Caliper)';
    }

    const instructionText = document.getElementById('instruction-text');
    if (instructionText) {
      instructionText.textContent = `Specimen Ø ${diameter} mm selected. Click 'Measure Specimen' or click the rod to engage the Vernier caliper.`;
    }
  }

  handleRecordButtonClick() {
    const currentState = stateMachine.getState();

    if (currentState === LAB_STATES.STATE_2_SPECIMEN_INSPECTION) {
      this.startCaliperMeasurement();
    } else if (currentState === LAB_STATES.STATE_3_INITIAL_MEASUREMENT) {
      this.recordInitialMeasurement();
    } else if (currentState === LAB_STATES.STATE_4_MOUNTING_DRAG_DROP) {
      this.mountSpecimenIntoUTM();
    } else if (currentState === LAB_STATES.STATE_12_FINAL_MEASUREMENT) {
      this.recordFinalMeasurement();
    }
  }

  startCaliperMeasurement() {
    this.setCameraView('METROLOGY_BENCH');
    this.caliper.measureDiameter(this.selectedRod, this.specimen.benchPosition);

    const loupePod = document.getElementById('caliper-loupe-pod');
    if (loupePod) {
      loupePod.classList.add('visible');
      this.caliper.updateLoupeCanvas();
    }

    stateMachine.transition(LAB_STATES.STATE_3_INITIAL_MEASUREMENT);

    const recordBtn = document.getElementById('btn-measure-record');
    if (recordBtn) {
      recordBtn.disabled = false;
      recordBtn.dataset.tooltip = `Record Measurement (d₀ = ${this.selectedRod.toFixed(2)} mm)`;
    }

    const instructionText = document.getElementById('instruction-text');
    if (instructionText) {
      instructionText.textContent = `Vernier caliper measuring Ø ${this.selectedRod.toFixed(2)} mm. Click 'Record Measurement' to confirm d₀.`;
    }
  }

  recordInitialMeasurement() {
    const d0 = this.selectedRod;
    const A0 = (Math.PI / 4) * Math.pow(d0, 2);

    this.initialMeasurements = {
      diameter_mm: d0,
      area_mm2: A0,
      gaugeLength_mm: 300.0
    };

    // Close caliper back to rest
    this.caliper.setRestingOnBench();
    const loupePod = document.getElementById('caliper-loupe-pod');
    if (loupePod) loupePod.classList.remove('visible');

    // Transition to mounting state
    stateMachine.transition(LAB_STATES.STATE_4_MOUNTING_DRAG_DROP);
    this.environment.setSnapGuideState('hover');

    // Switch view to overview so both bench and UTM machine are in full view
    this.setCameraView('OVERVIEW');

    // Enable button to mount
    const recordBtn = document.getElementById('btn-measure-record');
    if (recordBtn) {
      recordBtn.disabled = false;
      recordBtn.dataset.tooltip = 'Mount Specimen on UTM';
    }

    const instructionText = document.getElementById('instruction-text');
    if (instructionText) {
      instructionText.textContent = 'Initial measurement logged. Click "Mount Specimen" or click the rod on the bench to install in UTM.';
    }
  }

  mountSpecimenIntoUTM() {
    // Animate specimen flying and snapping into UTM grips
    this.specimen.mountToUTM();
    this.utmApparatus.clampGrips(true);
    this.environment.setSnapGuideState('none');

    // Ensure loupe is hidden
    const loupePod = document.getElementById('caliper-loupe-pod');
    if (loupePod) loupePod.classList.remove('visible');
    this.caliper.setRestingOnBench();

    // Transition to clamped zero tare state
    stateMachine.transition(LAB_STATES.STATE_5_CLAMPED_ZERO_TARE);

    // Zoom into UTM grips
    this.setCameraView('UTM_GRIPS');

    // Disable measure button, enable Tare
    const recordBtn = document.getElementById('btn-measure-record');
    if (recordBtn) {
      recordBtn.disabled = true;
      recordBtn.dataset.tooltip = 'Mounted in UTM';
    }

    const tareBtn = document.getElementById('btn-tare');
    if (tareBtn) tareBtn.disabled = false;

    const instructionText = document.getElementById('instruction-text');
    if (instructionText) {
      instructionText.textContent = 'Specimen clamped securely. Click "Tare / Zero" to calibrate sensors.';
    }
  }

  recordFinalMeasurement() {
    const recordBtn = document.getElementById('btn-measure-record');
    if (recordBtn) recordBtn.disabled = true;

    // Move to Lab Report state
    stateMachine.transition(LAB_STATES.STATE_13_RESULTS_REPORT);
    events.emit('SHOW_LAB_REPORT', {
      material: this.selectedMaterial,
      rod: this.selectedRod,
      initial: this.initialMeasurements,
      final: this.postFractureMeasurements,
      milestones: this.tensileEngine.milestones,
      history: this.tensileEngine.history
    });
  }

  zeroTareTransducers() {
    // Reset gauges to exact 0
    document.getElementById('gauge-load').textContent = '0.00';
    document.getElementById('gauge-elongation').textContent = '0.00';
    document.getElementById('gauge-stress').textContent = '0.0';
    document.getElementById('gauge-strain').textContent = '0.0000';

    const tareBtn = document.getElementById('btn-tare');
    if (tareBtn) tareBtn.disabled = true;

    const startBtn = document.getElementById('btn-start-test');
    if (startBtn) startBtn.disabled = false;

    events.emit('TRANSDUCERS_TARED', { timestamp: performance.now() });

    const instructionText = document.getElementById('instruction-text');
    if (instructionText) {
      instructionText.textContent = 'Transducers tared to 0.00. Click "Start Test" to initiate tensile load application.';
    }
  }

  startTensileTest() {
    const startBtn = document.getElementById('btn-start-test');
    if (startBtn) startBtn.disabled = true;

    this.tensileEngine.configure(this.selectedMaterial, this.selectedRod, 300.0);
    this.tensileEngine.start();
  }

  bindEvents() {
    // 1. Live Telemetry Transducer Readouts from Physics Engine
    events.on('PHYSICS_TICK', (data) => {
      const loadElem = document.getElementById('gauge-load');
      const elongElem = document.getElementById('gauge-elongation');
      const stressElem = document.getElementById('gauge-stress');
      const strainElem = document.getElementById('gauge-strain');

      if (loadElem) loadElem.textContent = data.load_kN.toFixed(2);
      if (elongElem) elongElem.textContent = data.elongation_mm.toFixed(2);
      if (stressElem) stressElem.textContent = data.stress_MPa.toFixed(1);
      if (strainElem) strainElem.textContent = data.strain.toFixed(4);
    });

    // 2. Specimen Fracture Event Handling
    events.on('FRACTURE_OCCURRED', ({ milestones }) => {
      // 1. Physically break specimen rod at the center in 3D
      if (this.specimen) {
        this.specimen.triggerFracture();
      }

      // 2. Visceral acoustic cleavage and machine shockwave
      audioSynthesizer.playFractureSound();

      // 3. Camera micro-jolt (sudden stored elastic energy release)
      this.sceneManager.triggerImpactShake(0.018, 260);

      // 4. Focus camera on UTM grips to inspect the central break
      this.setCameraView('UTM_GRIPS');

      const statusBlock = document.getElementById('machine-status-block');
      const statusText = document.getElementById('status-text');
      if (statusBlock) statusBlock.className = 'machine-status-block fracture';
      if (statusText) statusText.textContent = 'SPECIMEN FRACTURED';

      // Calculate post-fracture dimensions based on material physics
      const isMildSteel = this.selectedMaterial === 'MILD_STEEL';
      const finalLf = 300.0 + milestones.fracture.finalElongation_mm;
      const finalDf = isMildSteel 
        ? Math.sqrt(1 - 0.55) * this.selectedRod 
        : this.selectedRod;
      const finalAf = (Math.PI / 4) * Math.pow(finalDf, 2);

      this.postFractureMeasurements = {
        finalGaugeLength_mm: finalLf,
        finalDiameter_mm: finalDf,
        finalArea_mm2: finalAf,
        elongationPercent: (milestones.fracture.finalElongation_mm / 300.0) * 100,
        reductionInAreaPercent: isMildSteel ? 55.0 : 0.0
      };

      // Transition to final measurement state
      stateMachine.transition(LAB_STATES.STATE_12_FINAL_MEASUREMENT);

      // Re-enable Record button for final measurement
      const recordBtn = document.getElementById('btn-measure-record');
      if (recordBtn) {
        recordBtn.disabled = false;
        recordBtn.dataset.tooltip = 'View Lab Report';
      }

      const instructionText = document.getElementById('instruction-text');
      if (instructionText) {
        instructionText.textContent = 'Test complete. Click "View Lab Report" to open certified report and calculations.';
      }
    });

    // 3. State Change UI Updates
    events.on('STATE_CHANGED', ({ currentState, info }) => {
      const stepNumber = document.getElementById('step-number');
      const stepName = document.getElementById('step-name');
      const instructionText = document.getElementById('instruction-text');
      const statusBlock = document.getElementById('machine-status-block');
      const statusText = document.getElementById('status-text');

      if (stepNumber) stepNumber.textContent = `STEP ${info.step}/13`;
      if (stepName) stepName.textContent = info.title;
      if (instructionText && !instructionText.dataset.manualOverride) {
        instructionText.textContent = info.instruction;
      }

      // Adjust Status Block state
      if (!statusBlock || !statusText) return;

      if (currentState === LAB_STATES.STATE_6_LOADING_ELASTIC || currentState === LAB_STATES.STATE_8_STRAIN_HARDENING) {
        statusBlock.className = 'machine-status-block running';
        statusText.textContent = 'TEST IN PROGRESS';
      } else if (currentState === LAB_STATES.STATE_7_YIELDING || currentState === LAB_STATES.STATE_10_NECKING_INSTABILITY) {
        statusBlock.className = 'machine-status-block warning';
        statusText.textContent = 'PLASTIC INSTABILITY';
      } else if (currentState === LAB_STATES.STATE_11_FRACTURE) {
        statusBlock.className = 'machine-status-block fracture';
        statusText.textContent = 'SPECIMEN FRACTURED';
      } else if (currentState === LAB_STATES.STATE_12_FINAL_MEASUREMENT) {
        statusBlock.className = 'machine-status-block';
        statusText.textContent = 'METROLOGY INSPECTION';
      } else if (currentState === LAB_STATES.STATE_13_RESULTS_REPORT) {
        statusBlock.className = 'machine-status-block';
        statusText.textContent = 'TEST COMPLETE';
      } else {
        statusBlock.className = 'machine-status-block';
        statusText.textContent = 'READY / STANDBY';
      }
    });

    events.on('SWITCH_CAMERA', ({ viewKey }) => {
      this.setCameraView(viewKey);
    });

    events.on('EMERGENCY_STOP', () => {
      this.tensileEngine.stop();
      const statusBlock = document.getElementById('machine-status-block');
      const statusText = document.getElementById('status-text');
      if (statusBlock) statusBlock.className = 'machine-status-block estop';
      if (statusText) statusText.textContent = 'E-STOP TRIPPED';

      const startBtn = document.getElementById('btn-start-test');
      if (startBtn) startBtn.disabled = true;
    });
  }

  triggerEmergencyStop() {
    console.warn('[Application] EMERGENCY STOP TRIGGERED!');
    events.emit('EMERGENCY_STOP', { timestamp: performance.now() });
  }

  resetSimulation() {
    this.tensileEngine.reset();
    this.realtimeCharts.reset();
    this.labReportModal.hide();
    stateMachine.reset();
    events.emit('RESET_EXPERIMENT', {});
    this.selectMaterial('MILD_STEEL');
    this.selectRod(8);
    this.setCameraView('OVERVIEW');

    // Reset buttons
    const tareBtn = document.getElementById('btn-tare');
    if (tareBtn) tareBtn.disabled = true;
    const startBtn = document.getElementById('btn-start-test');
    if (startBtn) startBtn.disabled = true;
    const recordBtn = document.getElementById('btn-measure-record');
    if (recordBtn) {
      recordBtn.disabled = false;
      recordBtn.dataset.tooltip = 'Measure Specimen (Caliper)';
    }

    // Reset loupe
    const loupePod = document.getElementById('caliper-loupe-pod');
    if (loupePod) loupePod.classList.remove('visible');

    // Zero out gauges
    document.getElementById('gauge-load').textContent = '0.00';
    document.getElementById('gauge-elongation').textContent = '0.00';
    document.getElementById('gauge-stress').textContent = '0.0';
    document.getElementById('gauge-strain').textContent = '0.0000';
  }
}

// Bootstrap once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.__utmApp = new Application();
});
