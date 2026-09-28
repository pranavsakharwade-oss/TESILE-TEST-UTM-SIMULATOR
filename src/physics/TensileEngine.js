import { MATERIALS } from './MaterialConstants.js';
import { events } from '../core/EventBus.js';
import { stateMachine, LAB_STATES } from '../core/StateMachine.js';

export class TensileEngine {
  constructor() {
    this.materialKey = 'MILD_STEEL';
    this.diameter_mm = 8.0;
    this.gaugeLength_mm = 300.0;
    this.area_mm2 = (Math.PI / 4) * Math.pow(this.diameter_mm, 2);

    this.isRunning = false;
    this.isPaused = false;
    this.isFractured = false;

    this.elongation_mm = 0.0;
    this.strain = 0.0;
    this.stress_MPa = 0.0;
    this.load_kN = 0.0;
    this.stage = 'ready'; // 'ready' | 'elastic' | 'yielding' | 'hardening' | 'ultimate' | 'necking' | 'fracture'
    this.neckProgress = 0.0;

    // Simulation speed factor (mm/sec elongation rate)
    this.speed_mm_s = 2.4; // ~30 sec full ductile test
    this.elapsedTime = 0.0;

    // Time-series telemetry history for plotting and report generation
    this.history = [];
    this.milestones = {
      upperYield: null,
      lowerYield: null,
      ultimate: null,
      fracture: null
    };

    this.bindEvents();
  }

  configure(materialKey, diameter_mm, gaugeLength_mm = 300.0) {
    this.materialKey = materialKey;
    this.diameter_mm = diameter_mm;
    this.gaugeLength_mm = gaugeLength_mm;
    this.area_mm2 = (Math.PI / 4) * Math.pow(diameter_mm, 2);
    this.reset();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.isFractured = false;
    this.stage = 'elastic';
    stateMachine.transition(LAB_STATES.STATE_6_LOADING_ELASTIC);
    events.emit('TEST_STARTED', { timestamp: performance.now() });
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
  }

  reset() {
    this.stop();
    this.isFractured = false;
    this.elongation_mm = 0.0;
    this.strain = 0.0;
    this.stress_MPa = 0.0;
    this.load_kN = 0.0;
    this.neckProgress = 0.0;
    this.elapsedTime = 0.0;
    this.stage = 'ready';
    this.history = [];
    this.milestones = {
      upperYield: null,
      lowerYield: null,
      ultimate: null,
      fracture: null
    };

    events.emit('PHYSICS_RESET', {});
  }

  update(deltaSeconds) {
    if (!this.isRunning || this.isPaused || this.isFractured) return;

    const dt = Math.min(deltaSeconds, 0.05); // Clamp dt to prevent tunneling
    this.elapsedTime += dt;

    if (this.materialKey === 'MILD_STEEL') {
      this.updateMildSteel(dt);
    } else {
      this.updateGreyCastIron(dt);
    }

    // Capture telemetry snapshot
    const snapshot = {
      time: this.elapsedTime,
      elongation_mm: this.elongation_mm,
      strain: this.strain,
      stress_MPa: this.stress_MPa,
      load_kN: this.load_kN,
      stage: this.stage,
      neckProgress: this.neckProgress,
      isFractured: this.isFractured
    };

    this.history.push(snapshot);
    events.emit('PHYSICS_TICK', snapshot);

    if (this.isFractured) {
      this.handleFracture();
    }
  }

  updateMildSteel(dt) {
    // Crosshead rate: 2.2 mm/s
    this.elongation_mm += this.speed_mm_s * dt;
    this.strain = this.elongation_mm / this.gaugeLength_mm;

    const E = 205000;              // Young's modulus in MPa (205 GPa)
    const sigma_uy = 310;          // Upper yield stress (MPa)
    const sigma_ly = 280;          // Lower yield stress (MPa)
    const sigma_uts = 440;         // Ultimate tensile strength (MPa)
    const sigma_frac = 330;        // Breaking nominal stress (MPa)

    const eps_elastic = sigma_uy / E;      // ~0.00151
    const eps_yield_end = 0.020;           // 2.0% strain (Lüders band plateau end)
    const eps_uts = 0.16;                  // 16% strain at UTS
    const eps_fracture = 0.24;             // 24% total elongation at rupture

    if (this.strain < eps_elastic) {
      // 1. Linear Elastic Region (Hooke's Law)
      this.stage = 'elastic';
      this.stress_MPa = E * this.strain;
      this.neckProgress = 0.0;
    } else if (this.strain < eps_yield_end) {
      // 2. Yield Drop & Lüders Band Plateau
      if (this.stage === 'elastic') {
        this.stage = 'yielding';
        stateMachine.transition(LAB_STATES.STATE_7_YIELDING);
        if (!this.milestones.upperYield) {
          this.milestones.upperYield = {
            stress_MPa: sigma_uy,
            load_kN: (sigma_uy * this.area_mm2) / 1000,
            strain: eps_elastic,
            elongation_mm: eps_elastic * this.gaugeLength_mm
          };
        }
      }

      // Initial drop from upper to lower yield within 0.001 strain
      const dropProgress = Math.min(1.0, (this.strain - eps_elastic) / 0.0012);
      const baseYield = sigma_uy - (sigma_uy - sigma_ly) * dropProgress;

      // Realistic subtle Lüders micro-fluctuations (±1.5 MPa)
      const ripple = Math.sin(this.strain * 600) * 1.5;
      this.stress_MPa = baseYield + ripple;
      this.neckProgress = 0.0;

      if (!this.milestones.lowerYield && dropProgress >= 0.95) {
        this.milestones.lowerYield = {
          stress_MPa: sigma_ly,
          load_kN: (sigma_ly * this.area_mm2) / 1000,
          strain: this.strain,
          elongation_mm: this.elongation_mm
        };
      }
    } else if (this.strain < eps_uts) {
      // 3. Strain Hardening Region (Dislocation multiplication)
      if (this.stage === 'yielding') {
        this.stage = 'hardening';
        stateMachine.transition(LAB_STATES.STATE_8_STRAIN_HARDENING);
      }

      const t = (this.strain - eps_yield_end) / (eps_uts - eps_yield_end);
      // Smooth parabolic rise with zero slope at t = 1.0 (UTS)
      this.stress_MPa = sigma_ly + (sigma_uts - sigma_ly) * (1 - Math.pow(1 - t, 1.8));
      this.neckProgress = 0.0;

      if (t > 0.95 && this.stage !== 'ultimate') {
        this.stage = 'ultimate';
        stateMachine.transition(LAB_STATES.STATE_9_ULTIMATE_PEAK);
        if (!this.milestones.ultimate) {
          this.milestones.ultimate = {
            stress_MPa: sigma_uts,
            load_kN: (sigma_uts * this.area_mm2) / 1000,
            strain: eps_uts,
            elongation_mm: eps_uts * this.gaugeLength_mm
          };
        }
      }
    } else if (this.strain < eps_fracture) {
      // 4. Localized Necking / Plastic Instability (Considere's criterion)
      if (this.stage !== 'necking') {
        this.stage = 'necking';
        stateMachine.transition(LAB_STATES.STATE_10_NECKING_INSTABILITY);
      }

      const u = (this.strain - eps_uts) / (eps_fracture - eps_uts);
      this.neckProgress = u;
      // Load drop due to rapidly contracting cross-section
      this.stress_MPa = sigma_uts - (sigma_uts - sigma_frac) * Math.pow(u, 1.25);
    } else {
      // 5. Cup-and-Cone Ductile Fracture
      this.isFractured = true;
      this.stage = 'fracture';
      this.stress_MPa = 0.0;
      this.load_kN = 0.0;
      this.neckProgress = 1.0;

      this.milestones.fracture = {
        breakingLoad_kN: (sigma_frac * this.area_mm2) / 1000,
        breakingStress_MPa: sigma_frac,
        fractureStrain: eps_fracture,
        finalElongation_mm: eps_fracture * this.gaugeLength_mm
      };
      return;
    }

    this.load_kN = Math.max(0, (this.stress_MPa * this.area_mm2) / 1000);
  }

  updateGreyCastIron(dt) {
    // Brittle cast iron fails at very small strain (0.8% = 2.4 mm), speed tuned to 0.12 mm/s
    this.elongation_mm += 0.12 * dt;
    this.strain = this.elongation_mm / this.gaugeLength_mm;

    const sigma_uts = 200;      // UTS in tension (MPa)
    const eps_fracture = 0.008; // 0.8% fracture strain (Zero necking)

    if (this.strain < eps_fracture) {
      this.stage = 'elastic';
      // Sub-linear curve characteristic of flake graphite iron
      const t = this.strain / eps_fracture;
      this.stress_MPa = sigma_uts * (1.35 * t - 0.35 * Math.pow(t, 2));
      this.neckProgress = 0.0;
      this.load_kN = Math.max(0, (this.stress_MPa * this.area_mm2) / 1000);
    } else {
      // Immediate flat cleavage rupture
      this.isFractured = true;
      this.stage = 'fracture';
      this.stress_MPa = 0.0;
      this.load_kN = 0.0;
      this.neckProgress = 0.0;

      this.milestones.ultimate = {
        stress_MPa: sigma_uts,
        load_kN: (sigma_uts * this.area_mm2) / 1000,
        strain: eps_fracture,
        elongation_mm: eps_fracture * this.gaugeLength_mm
      };

      this.milestones.fracture = {
        breakingLoad_kN: (sigma_uts * this.area_mm2) / 1000,
        breakingStress_MPa: sigma_uts,
        fractureStrain: eps_fracture,
        finalElongation_mm: eps_fracture * this.gaugeLength_mm
      };
    }
  }

  handleFracture() {
    this.stop();
    stateMachine.transition(LAB_STATES.STATE_11_FRACTURE);
    events.emit('FRACTURE_OCCURRED', {
      material: this.materialKey,
      milestones: this.milestones,
      history: this.history
    });
  }

  bindEvents() {
    events.on('START_TEST', ({ material, rod }) => {
      this.configure(material, rod, 300.0);
      this.start();
    });

    events.on('EMERGENCY_STOP', () => {
      this.stop();
    });

    events.on('RESET_EXPERIMENT', () => {
      this.reset();
    });
  }
}
