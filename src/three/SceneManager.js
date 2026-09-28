import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const CAMERA_PRESETS = {
  OVERVIEW: {
    position: new THREE.Vector3(1.8, 1.5, 2.2),
    target: new THREE.Vector3(0, 0.9, 0)
  },
  UTM_GRIPS: {
    position: new THREE.Vector3(0.5, 1.25, 0.8),
    target: new THREE.Vector3(0, 1.15, 0)
  },
  METROLOGY_BENCH: {
    position: new THREE.Vector3(-0.9, 1.35, 0.8),
    target: new THREE.Vector3(-0.9, 0.95, 0)
  },
  CONSOLE_MONITOR: {
    position: new THREE.Vector3(0.55, 1.22, 0.68),
    target: new THREE.Vector3(0.64, 1.16, 0.08)
  }
};

export class SceneManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.animationCallbacks = new Set();
    this.targetCameraPos = null;
    this.targetLookAt = null;
    this.isTransitioningCamera = false;

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initEvents();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf1f5f9);
    this.scene.fog = new THREE.FogExp2(0xf1f5f9, 0.08);
  }

  initCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.05, 50);
    const initialPreset = CAMERA_PRESETS.OVERVIEW;
    this.camera.position.copy(initialPreset.position);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.container.appendChild(this.renderer.domElement);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going beneath floor
    this.controls.minDistance = 0.3;
    this.controls.maxDistance = 6.0;
    this.controls.target.copy(CAMERA_PRESETS.OVERVIEW.target);
    this.controls.update();
  }

  initEvents() {
    window.addEventListener('resize', () => this.onWindowResize());
    if (window.ResizeObserver && this.container) {
      this.resizeObserver = new ResizeObserver(() => this.onWindowResize());
      this.resizeObserver.observe(this.container);
    }
  }

  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setCameraPreset(presetKey) {
    const preset = CAMERA_PRESETS[presetKey];
    if (!preset) return;

    this.targetCameraPos = preset.position.clone();
    this.targetLookAt = preset.target.clone();
    this.isTransitioningCamera = true;
  }

  add(object3D) {
    this.scene.add(object3D);
  }

  registerAnimationCallback(callback) {
    this.animationCallbacks.add(callback);
    return () => this.animationCallbacks.delete(callback);
  }

  triggerImpactShake(intensity = 0.012, durationMs = 220) {
    this.shakeIntensity = intensity;
    this.shakeDuration = durationMs;
    this.shakeStartTime = performance.now();
  }

  animate(time) {
    requestAnimationFrame(this.animate);

    // Smooth camera transition if active
    if (this.isTransitioningCamera && this.targetCameraPos && this.targetLookAt) {
      this.camera.position.lerp(this.targetCameraPos, 0.08);
      this.controls.target.lerp(this.targetLookAt, 0.08);

      if (
        this.camera.position.distanceTo(this.targetCameraPos) < 0.01 &&
        this.controls.target.distanceTo(this.targetLookAt) < 0.01
      ) {
        this.camera.position.copy(this.targetCameraPos);
        this.controls.target.copy(this.targetLookAt);
        this.isTransitioningCamera = false;
      }
    }

    // Camera shake calculation for high-energy rupture impact
    if (this.shakeDuration > 0) {
      const elapsed = performance.now() - this.shakeStartTime;
      if (elapsed < this.shakeDuration) {
        const decay = 1 - (elapsed / this.shakeDuration);
        const currentAmp = this.shakeIntensity * Math.pow(decay, 2);
        const shakeX = (Math.random() * 2 - 1) * currentAmp;
        const shakeY = (Math.random() * 2 - 1) * currentAmp;
        this.camera.position.x += shakeX;
        this.camera.position.y += shakeY;
      } else {
        this.shakeDuration = 0;
      }
    }

    this.controls.update();

    // Run registered tick updates (physics, mesh animations, etc.)
    for (const callback of this.animationCallbacks) {
      try {
        callback(time);
      } catch (err) {
        console.error('[SceneManager] Error in animation callback:', err);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
