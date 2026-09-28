import * as THREE from 'three';
import { events } from '../core/EventBus.js';
import { stateMachine, LAB_STATES } from '../core/StateMachine.js';
import { audioSynthesizer } from '../audio/AudioSynthesizer.js';

export class InteractionManager {
  constructor(sceneManager, specimen, caliper, utmApparatus, environment, app) {
    this.sceneManager = sceneManager;
    this.specimen = specimen;
    this.caliper = caliper;
    this.utmApparatus = utmApparatus;
    this.environment = environment;
    this.app = app;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.domElement = this.sceneManager.renderer.domElement;

    this.hoveredObject = null;

    this.initEvents();
  }

  initEvents() {
    this.domElement.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));
  }

  updateMouseCoords(event) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  onPointerMove(event) {
    this.updateMouseCoords(event);
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

    const interactiveObjects = [
      ...this.specimen.group.children,
      ...this.caliper.group.children,
      ...(this.utmApparatus.interactiveControls || [])
    ];

    const intersects = this.raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
      this.domElement.style.cursor = 'pointer';
      const hit = intersects[0].object;
      this.hoveredObject = hit;

      // Check if hovering over console 3D control
      let ctrl = hit;
      while (ctrl && !ctrl.name && ctrl.parent && ctrl !== this.utmApparatus.group) {
        ctrl = ctrl.parent;
      }

      if (ctrl && ctrl.name) {
        if (ctrl.name === 'btnEstop') {
          this.domElement.title = 'EMERGENCY STOP (Click to trip machine)';
        } else if (ctrl.name === 'btnStart') {
          this.domElement.title = 'START TEST (Click to apply tensile load)';
        } else if (ctrl.name === 'btnTare') {
          this.domElement.title = 'TARE TRANSDUCERS (Click to zero sensors)';
        } else if (ctrl.name === 'btnReset') {
          this.domElement.title = 'RESET SIMULATION (Click to reset test)';
        } else if (ctrl.name === 'wheelFlow') {
          this.domElement.title = 'FINE FLOW CONTROL VALVE (Click to turn)';
        } else if (ctrl.name === 'wheelReturn') {
          this.domElement.title = 'PRESSURE RELEASE VALVE (Click to turn)';
        }
      } else {
        this.domElement.title = '';
      }
    } else {
      this.domElement.style.cursor = 'default';
      this.domElement.title = '';
      this.hoveredObject = null;
    }
  }

  onPointerDown(event) {
    this.updateMouseCoords(event);
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

    const interactiveObjects = [
      ...this.specimen.group.children,
      ...this.caliper.group.children,
      ...(this.utmApparatus.interactiveControls || [])
    ];

    const intersects = this.raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      this.handleObjectClick(hitObj);
    }
  }

  handleObjectClick(object) {
    // 1. Check if clicked a 3D UTM apparatus console control
    let ctrl = object;
    while (ctrl && ctrl !== this.utmApparatus.group) {
      if (ctrl.name && (
        ctrl.name === 'btnEstop' ||
        ctrl.name === 'btnStart' ||
        ctrl.name === 'btnTare' ||
        ctrl.name === 'btnReset' ||
        ctrl.name === 'wheelFlow' ||
        ctrl.name === 'wheelReturn'
      )) {
        break;
      }
      ctrl = ctrl.parent;
    }

    if (ctrl && ctrl.name) {
      if (ctrl.name === 'btnEstop') {
        audioSynthesizer.playEstopSound();
        this.utmApparatus.pressButton(this.utmApparatus.btnEstop);
        if (this.app) this.app.triggerEmergencyStop();
        return;
      }
      if (ctrl.name === 'btnStart') {
        audioSynthesizer.playClickSound();
        this.utmApparatus.pressButton(this.utmApparatus.btnStart);
        const startBtn = document.getElementById('btn-start-test');
        if (startBtn && !startBtn.disabled) {
          if (this.app) this.app.startTensileTest();
        }
        return;
      }
      if (ctrl.name === 'btnTare') {
        audioSynthesizer.playClickSound();
        this.utmApparatus.pressButton(this.utmApparatus.btnTare);
        const tareBtn = document.getElementById('btn-tare');
        if (tareBtn && !tareBtn.disabled) {
          if (this.app) this.app.zeroTareTransducers();
        }
        return;
      }
      if (ctrl.name === 'btnReset') {
        audioSynthesizer.playClickSound();
        this.utmApparatus.pressButton(this.utmApparatus.btnReset);
        if (this.app) this.app.resetSimulation();
        return;
      }
      if (ctrl.name === 'wheelFlow') {
        audioSynthesizer.playValveSound();
        this.utmApparatus.turnValveWheel(this.utmApparatus.wheelR, Math.PI / 4);
        return;
      }
      if (ctrl.name === 'wheelReturn') {
        audioSynthesizer.playValveSound();
        this.utmApparatus.turnValveWheel(this.utmApparatus.wheelL, Math.PI / 4);
        return;
      }
    }
    const currentState = stateMachine.getState();

    // Check if specimen clicked
    let isSpecimen = false;
    let curr = object;
    while (curr) {
      if (curr === this.specimen.group) {
        isSpecimen = true;
        break;
      }
      curr = curr.parent;
    }

    // Check if caliper clicked
    let isCaliper = false;
    curr = object;
    while (curr) {
      if (curr === this.caliper.group) {
        isCaliper = true;
        break;
      }
      curr = curr.parent;
    }

    if (isSpecimen) {
      if (currentState === LAB_STATES.STATE_2_SPECIMEN_INSPECTION) {
        if (this.app) this.app.startCaliperMeasurement();
      } else if (currentState === LAB_STATES.STATE_3_INITIAL_MEASUREMENT) {
        if (this.app) this.app.recordInitialMeasurement();
      } else if (currentState === LAB_STATES.STATE_4_MOUNTING_DRAG_DROP) {
        if (this.app) this.app.mountSpecimenIntoUTM();
      }
    } else if (isCaliper) {
      if (currentState === LAB_STATES.STATE_2_SPECIMEN_INSPECTION) {
        if (this.app) this.app.startCaliperMeasurement();
      } else if (currentState === LAB_STATES.STATE_3_INITIAL_MEASUREMENT) {
        if (this.app) this.app.recordInitialMeasurement();
      }
    }
  }
}
