import { events } from '../core/EventBus.js';

export class RealtimeCharts {
  constructor(canvasId = 'realtime-chart-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn(`[RealtimeCharts] Canvas #${canvasId} not found.`);
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.mode = 'load'; // 'load' (Load vs ΔL) | 'stress' (Stress vs Strain)
    this.dataPoints = [];
    this.milestones = null;

    this.initCanvasResolution();
    this.initUI();
    this.bindEvents();
    this.render();
  }

  initCanvasResolution() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width || 332;
    this.height = rect.height || 180;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  initUI() {
    const loadTab = document.getElementById('chart-tab-load');
    const stressTab = document.getElementById('chart-tab-stress');

    if (loadTab) {
      loadTab.addEventListener('click', () => {
        this.mode = 'load';
        loadTab.classList.add('active');
        if (stressTab) stressTab.classList.remove('active');
        this.render();
      });
    }

    if (stressTab) {
      stressTab.addEventListener('click', () => {
        this.mode = 'stress';
        stressTab.classList.add('active');
        if (loadTab) loadTab.classList.remove('active');
        this.render();
      });
    }

    window.addEventListener('resize', () => {
      this.initCanvasResolution();
      this.render();
    });
  }

  addDataPoint(point) {
    this.dataPoints.push(point);
    this.render();
  }

  setMilestones(milestones) {
    this.milestones = milestones;
    this.render();
  }

  reset() {
    this.dataPoints = [];
    this.milestones = null;
    this.render();
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear background (Clean subtle light surface)
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Padding for axes & labels
    const pad = { left: 44, right: 16, top: 16, bottom: 28 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Determine scale limits
    let maxX = this.mode === 'load' ? 75 : 0.25; // Default max elongation 75mm or strain 0.25
    let maxY = this.mode === 'load' ? 60 : 500;  // Default max load 60kN or stress 500MPa

    // Dynamic autoscaling if data exceeds defaults
    for (const pt of this.dataPoints) {
      const xVal = this.mode === 'load' ? pt.elongation_mm : pt.strain;
      const yVal = this.mode === 'load' ? pt.load_kN : pt.stress_MPa;
      if (xVal * 1.15 > maxX) maxX = xVal * 1.15;
      if (yVal * 1.15 > maxY) maxY = yVal * 1.15;
    }

    // 1. Draw Grid Lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '500 9px "Manrope", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const yDivisions = 4;
    for (let i = 0; i <= yDivisions; i++) {
      const val = (maxY / yDivisions) * i;
      const y = pad.top + plotH - (i / yDivisions) * plotH;

      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      const label = val >= 100 ? Math.round(val) : val.toFixed(val < 10 ? 1 : 0);
      ctx.fillText(label, pad.left - 6, y);
    }

    const xDivisions = 4;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let j = 0; j <= xDivisions; j++) {
      const val = (maxX / xDivisions) * j;
      const x = pad.left + (j / xDivisions) * plotW;

      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
      ctx.stroke();

      const label = this.mode === 'load' ? Math.round(val) : val.toFixed(2);
      ctx.fillText(label, x, pad.top + plotH + 5);
    }

    // 2. Axis Units & Titles
    ctx.fillStyle = '#475569';
    ctx.font = '600 9px "Manrope", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const yUnit = this.mode === 'load' ? 'Load (kN)' : 'Stress σ (MPa)';
    ctx.fillText(yUnit, pad.left, 2);

    ctx.textAlign = 'right';
    const xUnit = this.mode === 'load' ? 'Elongation ΔL (mm)' : 'Strain ε (mm/mm)';
    ctx.fillText(xUnit, w - pad.right, h - 12);

    if (this.dataPoints.length === 0) return;

    // 3. Draw Plot Curve
    ctx.beginPath();
    ctx.strokeStyle = '#0284c7'; // Primary lab cyan
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let k = 0; k < this.dataPoints.length; k++) {
      const pt = this.dataPoints[k];
      const xVal = this.mode === 'load' ? pt.elongation_mm : pt.strain;
      const yVal = this.mode === 'load' ? pt.load_kN : pt.stress_MPa;

      const px = pad.left + (xVal / maxX) * plotW;
      const py = pad.top + plotH - (yVal / maxY) * plotH;

      if (k === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // 4. Subtle Area Gradient Fill Under Curve
    if (this.dataPoints.length > 2) {
      const lastPt = this.dataPoints[this.dataPoints.length - 1];
      const lastXVal = this.mode === 'load' ? lastPt.elongation_mm : lastPt.strain;
      const lastPx = pad.left + (lastXVal / maxX) * plotW;

      ctx.lineTo(lastPx, pad.top + plotH);
      ctx.lineTo(pad.left, pad.top + plotH);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
      grad.addColorStop(0, 'rgba(2, 132, 199, 0.12)');
      grad.addColorStop(1, 'rgba(2, 132, 199, 0.0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // 5. Draw Live Tracking Head
    const current = this.dataPoints[this.dataPoints.length - 1];
    const currX = this.mode === 'load' ? current.elongation_mm : current.strain;
    const currY = this.mode === 'load' ? current.load_kN : current.stress_MPa;
    const headX = pad.left + (currX / maxX) * plotW;
    const headY = pad.top + plotH - (currY / maxY) * plotH;

    // Glowing halo
    ctx.fillStyle = 'rgba(2, 132, 199, 0.25)';
    ctx.beginPath();
    ctx.arc(headX, headY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Solid core dot
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(headX, headY, 3, 0, Math.PI * 2);
    ctx.fill();

    // 6. Draw Key Milestone Badges if achieved
    if (this.milestones) {
      this.drawMilestoneTag(ctx, pad, plotW, plotH, maxX, maxY, this.milestones.ultimate, 'UTS', '#0284c7');
      if (this.milestones.fracture) {
        this.drawMilestoneTag(ctx, pad, plotW, plotH, maxX, maxY, this.milestones.fracture, 'BREAK', '#dc2626');
      }
    }
  }

  drawMilestoneTag(ctx, pad, plotW, plotH, maxX, maxY, milestone, label, color) {
    if (!milestone) return;
    const xVal = this.mode === 'load' ? (milestone.elongation_mm || milestone.finalElongation_mm) : (milestone.strain || milestone.fractureStrain);
    const yVal = this.mode === 'load' ? (milestone.load_kN || milestone.breakingLoad_kN) : (milestone.stress_MPa || milestone.breakingStress_MPa);

    if (xVal == null || yVal == null) return;

    const px = pad.left + (xVal / maxX) * plotW;
    const py = pad.top + plotH - (yVal / maxY) * plotH;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '700 8px "Manrope", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, px, py - 4);
  }

  bindEvents() {
    events.on('PHYSICS_TICK', (data) => {
      this.addDataPoint(data);
    });

    events.on('PHYSICS_RESET', () => {
      this.reset();
    });

    events.on('FRACTURE_OCCURRED', ({ milestones }) => {
      this.setMilestones(milestones);
    });
  }
}
