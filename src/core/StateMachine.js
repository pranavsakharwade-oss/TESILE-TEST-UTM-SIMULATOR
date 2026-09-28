import { events } from './EventBus.js';

export const LAB_STATES = {
  STATE_1_ROD_SELECTION: 'STATE_1_ROD_SELECTION',
  STATE_2_SPECIMEN_INSPECTION: 'STATE_2_SPECIMEN_INSPECTION',
  STATE_3_INITIAL_MEASUREMENT: 'STATE_3_INITIAL_MEASUREMENT',
  STATE_4_MOUNTING_DRAG_DROP: 'STATE_4_MOUNTING_DRAG_DROP',
  STATE_5_CLAMPED_ZERO_TARE: 'STATE_5_CLAMPED_ZERO_TARE',
  STATE_6_LOADING_ELASTIC: 'STATE_6_LOADING_ELASTIC',
  STATE_7_YIELDING: 'STATE_7_YIELDING',
  STATE_8_STRAIN_HARDENING: 'STATE_8_STRAIN_HARDENING',
  STATE_9_ULTIMATE_PEAK: 'STATE_9_ULTIMATE_PEAK',
  STATE_10_NECKING_INSTABILITY: 'STATE_10_NECKING_INSTABILITY',
  STATE_11_FRACTURE: 'STATE_11_FRACTURE',
  STATE_12_FINAL_MEASUREMENT: 'STATE_12_FINAL_MEASUREMENT',
  STATE_13_RESULTS_REPORT: 'STATE_13_RESULTS_REPORT'
};

export const STATE_INFO = {
  [LAB_STATES.STATE_1_ROD_SELECTION]: {
    step: 1,
    title: 'Select Rod Specimen',
    instruction: 'Choose an 8 mm, 10 mm, or 12 mm mild steel rod to begin the experiment.',
    actionRequired: 'Click a rod card on the right panel'
  },
  [LAB_STATES.STATE_2_SPECIMEN_INSPECTION]: {
    step: 2,
    title: 'Inspect Specimen',
    instruction: 'Inspect the specimen geometry and the auto-matched UTM machine capacity.',
    actionRequired: 'Click "Start Metrology" to use the Vernier caliper'
  },
  [LAB_STATES.STATE_3_INITIAL_MEASUREMENT]: {
    step: 3,
    title: 'Initial Metrology (Caliper)',
    instruction: 'Use the Vernier caliper to measure initial diameter (d₀) and gauge length (L₀ ≈ 300 mm).',
    actionRequired: 'Slide caliper jaws and record both measurements'
  },
  [LAB_STATES.STATE_4_MOUNTING_DRAG_DROP]: {
    step: 4,
    title: 'Mount Specimen on UTM',
    instruction: 'Drag the specimen from the workbench and drop it into the UTM grip alignment zone.',
    actionRequired: 'Drag rod and drop into the highlighted grip area'
  },
  [LAB_STATES.STATE_5_CLAMPED_ZERO_TARE]: {
    step: 5,
    title: 'Zero / Tare Machine',
    instruction: 'Grips are securely clamped. Tare the load cell and displacement sensors before loading.',
    actionRequired: 'Press the "Tare / Zero" button on the console'
  },
  [LAB_STATES.STATE_6_LOADING_ELASTIC]: {
    step: 6,
    title: 'Tensile Loading: Elastic Stage',
    instruction: 'Load is increasing linearly with elongation in accordance with Hooke\'s Law.',
    actionRequired: 'Observe real-time stress-strain curve'
  },
  [LAB_STATES.STATE_7_YIELDING]: {
    step: 7,
    title: 'Yield Phenomenon (Lüders Bands)',
    instruction: 'Specimen is yielding under slip bands. Yield load (Py) is being recorded.',
    actionRequired: 'Observe yield plateau on chart'
  },
  [LAB_STATES.STATE_8_STRAIN_HARDENING]: {
    step: 8,
    title: 'Strain Hardening',
    instruction: 'Dislocation pile-up increases material resistance up to maximum tensile load.',
    actionRequired: 'Observe load climbing to ultimate peak'
  },
  [LAB_STATES.STATE_9_ULTIMATE_PEAK]: {
    step: 9,
    title: 'Ultimate Tensile Strength (Pu)',
    instruction: 'Specimen reaches maximum sustainable load. Plastic instability initiates.',
    actionRequired: 'Observe peak load recorded'
  },
  [LAB_STATES.STATE_10_NECKING_INSTABILITY]: {
    step: 10,
    title: 'Localized Necking',
    instruction: 'Severe cross-sectional reduction forms at the center. Engineering load drops.',
    actionRequired: 'Observe waist contraction on 3D specimen'
  },
  [LAB_STATES.STATE_11_FRACTURE]: {
    step: 11,
    title: 'Ductile Fracture (Pb)',
    instruction: 'Specimen fractures with cup-and-cone morphology. Breaking load captured.',
    actionRequired: 'Machine halted automatically'
  },
  [LAB_STATES.STATE_12_FINAL_MEASUREMENT]: {
    step: 12,
    title: 'Post-Fracture Metrology',
    instruction: 'Use the Vernier caliper to measure final gauge length (Lf) and neck diameter (Dn).',
    actionRequired: 'Measure and record final dimensions'
  },
  [LAB_STATES.STATE_13_RESULTS_REPORT]: {
    step: 13,
    title: 'Lab Report & Calculations',
    instruction: 'Review tabulated lab results, calculated parameters, and stress-strain curves.',
    actionRequired: 'Export or review certified report'
  }
};

class StateMachine {
  constructor() {
    this.currentState = LAB_STATES.STATE_1_ROD_SELECTION;
    this.history = [];
    this.mode = 'guided'; // 'guided' | 'assessment'
  }

  getState() {
    return this.currentState;
  }

  getInfo() {
    return STATE_INFO[this.currentState];
  }

  setMode(mode) {
    this.mode = mode;
    events.emit('MODE_CHANGED', { mode });
  }

  getMode() {
    return this.mode;
  }

  transition(nextState, context = {}) {
    if (!LAB_STATES[nextState]) {
      console.error(`[StateMachine] Invalid state transition target: ${nextState}`);
      return false;
    }

    const prevState = this.currentState;
    this.history.push({ state: prevState, timestamp: performance.now() });
    this.currentState = nextState;

    console.log(`[StateMachine] Transition: ${prevState} -> ${nextState}`, context);

    events.emit('STATE_CHANGED', {
      previousState: prevState,
      currentState: nextState,
      info: STATE_INFO[nextState],
      context
    });

    return true;
  }

  reset() {
    this.currentState = LAB_STATES.STATE_1_ROD_SELECTION;
    this.history = [];
    events.emit('STATE_CHANGED', {
      previousState: null,
      currentState: this.currentState,
      info: STATE_INFO[this.currentState],
      context: { reset: true }
    });
  }
}

export const stateMachine = new StateMachine();
