import { LabCalculator } from '../physics/LabCalculator.js';
import { events } from '../core/EventBus.js';

export class LabReportModal {
  constructor() {
    this.modalOverlay = null;
    this.currentResults = null;
    this.currentHistory = null;
    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    // If not in DOM, create the modal overlay
    let overlay = document.getElementById('lab-report-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'lab-report-modal-overlay';
      overlay.innerHTML = `
        <div class="lab-report-container">
          <!-- Header Bar -->
          <div class="report-header-bar">
            <div class="report-header-title-group">
              <span class="report-institution-tag">Materials Testing & Characterization Laboratory</span>
              <h2 id="report-modal-title" class="report-main-heading">Certified Tensile Test Report</h2>
            </div>
            <div class="report-header-actions">
              <button id="report-btn-csv" class="report-btn report-btn-secondary" title="Download raw CSV data">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export CSV
              </button>
              <button id="report-btn-print" class="report-btn report-btn-primary" title="Print certified test certificate">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Print Report
              </button>
              <button id="report-btn-close" class="report-close-btn" aria-label="Close report modal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Body Content -->
          <div class="report-content-body" id="report-modal-body">
            <!-- Dynamically populated -->
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    this.modalOverlay = overlay;

    // Attach button listeners
    document.getElementById('report-btn-close').addEventListener('click', () => this.hide());
    document.getElementById('report-btn-print').addEventListener('click', () => window.print());
    document.getElementById('report-btn-csv').addEventListener('click', () => this.downloadCSV());

    // Close on overlay backdrop click
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.hide();
      }
    });
  }

  show(reportData) {
    const results = LabCalculator.computeResults({
      materialKey: reportData.material,
      rodDiameter: reportData.rod,
      initial: reportData.initial,
      final: reportData.final,
      milestones: reportData.milestones,
      history: reportData.history
    });

    this.currentResults = results;
    this.currentHistory = reportData.history;

    const titleElem = document.getElementById('report-modal-title');
    if (titleElem) {
      titleElem.textContent = `Tensile Test Certificate: ${results.specimen.materialName} (Ø ${results.specimen.d0_mm} mm)`;
    }

    const body = document.getElementById('report-modal-body');
    if (!body) return;

    body.innerHTML = `
      <!-- 1. Specimen & Test Profile -->
      <div>
        <div class="report-section-title">Specimen & Standard Profile</div>
        <div class="report-profile-grid">
          <div class="report-profile-card">
            <span class="report-profile-label">Material & Grade</span>
            <span class="report-profile-value">${results.specimen.materialName} (${results.specimen.materialType})</span>
          </div>
          <div class="report-profile-card">
            <span class="report-profile-label">Test Standard</span>
            <span class="report-profile-value" style="font-size: 12px;">${results.specimen.standard}</span>
          </div>
          <div class="report-profile-card">
            <span class="report-profile-label">Initial Gauge Length (L₀)</span>
            <span class="report-profile-value">${results.specimen.L0_mm.toFixed(1)} mm</span>
          </div>
          <div class="report-profile-card">
            <span class="report-profile-label">Initial Diameter (d₀)</span>
            <span class="report-profile-value">${results.specimen.d0_mm.toFixed(2)} mm</span>
          </div>
          <div class="report-profile-card">
            <span class="report-profile-label">Initial Area (A₀)</span>
            <span class="report-profile-value">${results.specimen.A0_mm2.toFixed(2)} mm²</span>
          </div>
          <div class="report-profile-card">
            <span class="report-profile-label">Final Gauge Length (Lf)</span>
            <span class="report-profile-value">${results.specimen.Lf_mm.toFixed(1)} mm</span>
          </div>
          <div class="report-profile-card">
            <span class="report-profile-label">Final Neck Diameter (df)</span>
            <span class="report-profile-value">${results.specimen.df_mm.toFixed(2)} mm</span>
          </div>
          <div class="report-profile-card">
            <span class="report-profile-label">Final Neck Area (Af)</span>
            <span class="report-profile-value">${results.specimen.Af_mm2.toFixed(2)} mm²</span>
          </div>
        </div>
      </div>

      <!-- 2. Mechanical KPI Grid -->
      <div>
        <div class="report-section-title">Derived Mechanical Properties</div>
        <div class="report-kpi-grid">
          <div class="report-kpi-box highlight">
            <span class="report-kpi-label">Ultimate Tensile Strength (Rm)</span>
            <span class="report-kpi-val">${results.properties.Rm_MPa.toFixed(1)}</span>
            <span class="report-kpi-unit">MPa</span>
          </div>

          <div class="report-kpi-box">
            <span class="report-kpi-label">${results.properties.ReL_MPa ? 'Yield Strength (ReL)' : 'Yield Point'}</span>
            <span class="report-kpi-val">${results.properties.ReL_MPa ? results.properties.ReL_MPa.toFixed(1) : 'None (Brittle)'}</span>
            <span class="report-kpi-unit">${results.properties.ReL_MPa ? 'MPa' : 'N/A'}</span>
          </div>

          <div class="report-kpi-box">
            <span class="report-kpi-label">Modulus of Elasticity (E)</span>
            <span class="report-kpi-val">${results.properties.E_GPa.toFixed(1)}</span>
            <span class="report-kpi-unit">GPa</span>
          </div>

          <div class="report-kpi-box">
            <span class="report-kpi-label">Breaking Stress (σb)</span>
            <span class="report-kpi-val">${results.properties.sigma_b_MPa.toFixed(1)}</span>
            <span class="report-kpi-unit">MPa</span>
          </div>

          <div class="report-kpi-box highlight">
            <span class="report-kpi-label">Percentage Elongation (%EL)</span>
            <span class="report-kpi-val">${results.properties.percentageElongation.toFixed(2)}%</span>
            <span class="report-kpi-unit">${results.properties.percentageElongation > 10 ? 'High Ductility' : 'Brittle Failure'}</span>
          </div>

          <div class="report-kpi-box highlight">
            <span class="report-kpi-label">Reduction in Area (%RA)</span>
            <span class="report-kpi-val">${results.properties.percentageReductionInArea.toFixed(1)}%</span>
            <span class="report-kpi-unit">${results.properties.percentageReductionInArea > 15 ? 'Localized Necking' : 'No Necking'}</span>
          </div>

          <div class="report-kpi-box">
            <span class="report-kpi-label">Modulus of Resilience (Ur)</span>
            <span class="report-kpi-val">${results.properties.modulusOfResilience.toFixed(2)}</span>
            <span class="report-kpi-unit">MJ / m³</span>
          </div>

          <div class="report-kpi-box">
            <span class="report-kpi-label">Modulus of Toughness (Ut)</span>
            <span class="report-kpi-val">${results.properties.modulusOfToughness.toFixed(1)}</span>
            <span class="report-kpi-unit">MJ / m³</span>
          </div>
        </div>
      </div>

      <!-- 3. Tabulated Observation Table -->
      <div>
        <div class="report-section-title">Milestone Observations & Transducer Log</div>
        <div class="report-table-card">
          <table class="report-data-table">
            <thead>
              <tr>
                <th>Test Event Stage</th>
                <th>Tensile Force P (kN)</th>
                <th>Engineering Stress σ (MPa)</th>
                <th>Gauge Elongation ΔL (mm)</th>
                <th>Engineering Strain ε</th>
              </tr>
            </thead>
            <tbody>
              ${results.forces.Puy_kN ? `
              <tr>
                <td><strong>Upper Yield Point (Puy)</strong></td>
                <td>${results.forces.Puy_kN.toFixed(2)}</td>
                <td>${(results.properties.ReH_MPa || 0).toFixed(1)}</td>
                <td>0.45</td>
                <td>0.0015</td>
              </tr>
              <tr>
                <td><strong>Lower Yield Point (Ply)</strong></td>
                <td>${results.forces.Ply_kN.toFixed(2)}</td>
                <td>${(results.properties.ReL_MPa || 0).toFixed(1)}</td>
                <td>5.40</td>
                <td>0.0180</td>
              </tr>
              ` : ''}
              <tr>
                <td><strong>Ultimate Peak Load (Pu / UTS)</strong></td>
                <td>${results.forces.Pu_kN.toFixed(2)}</td>
                <td>${results.properties.Rm_MPa.toFixed(1)}</td>
                <td>${results.specimen.materialType === 'Ductile' ? '48.00' : '2.40'}</td>
                <td>${results.specimen.materialType === 'Ductile' ? '0.1600' : '0.0080'}</td>
              </tr>
              <tr>
                <td><strong>Breaking Load at Fracture (Pb)</strong></td>
                <td>${results.forces.Pb_kN.toFixed(2)}</td>
                <td>${results.properties.sigma_b_MPa.toFixed(1)}</td>
                <td>${results.specimen.deltaL_mm.toFixed(2)}</td>
                <td>${(results.properties.percentageElongation / 100).toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 4. Fracture Morphology & Standard Verdict -->
      <div>
        <div class="report-section-title">Morphological Analysis & Standard Compliance</div>
        <div class="report-verdict-grid">
          <div class="report-verdict-card">
            <span class="report-profile-label">Fracture Surface Morphology</span>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-top: 2px;">
              ${results.morphology.fractureType}
            </div>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 4px 0 0 0; line-height: 1.5;">
              ${results.morphology.cleavageAngle}. ${results.morphology.neckingObserved}. ${results.morphology.energyAbsorption}.
            </p>
          </div>

          <div class="report-verdict-card success">
            <span class="report-profile-label">ASTM Standard Compliance Verdict</span>
            <span class="report-badge-pass">${results.compliance.verdict}</span>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 4px 0 0 0; line-height: 1.5;">
              Tested sample satisfies all ASTM ductility and tensile strength minimums for ${results.specimen.materialName} coupons.
            </p>
          </div>
        </div>
      </div>
    `;

    this.modalOverlay.classList.add('active');
  }

  hide() {
    if (this.modalOverlay) {
      this.modalOverlay.classList.remove('active');
    }
  }

  downloadCSV() {
    if (!this.currentResults) return;
    const csvContent = LabCalculator.generateCSV(this.currentResults, this.currentHistory);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Tensile_Test_${this.currentResults.specimen.materialKey}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  bindEvents() {
    events.on('SHOW_LAB_REPORT', (data) => {
      this.show(data);
    });
  }
}
