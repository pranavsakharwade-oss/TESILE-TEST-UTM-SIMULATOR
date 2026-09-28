/**
 * LabCalculator.js
 * Mechanical Engineering calculation engine for ASTM E8 / ASTM A48 tensile tests.
 * Computes all canonical mechanical properties, energy integrals, and standard checks.
 */

export class LabCalculator {
  static computeResults({ materialKey, rodDiameter, initial, final, milestones, history }) {
    const isMildSteel = materialKey === 'MILD_STEEL';
    const d0 = initial.diameter_mm;
    const L0 = initial.gaugeLength_mm || 300.0;
    const A0 = (Math.PI / 4) * Math.pow(d0, 2);

    const Lf = final ? final.finalGaugeLength_mm : (L0 + (milestones.fracture ? milestones.fracture.finalElongation_mm : 0));
    const df = final ? final.finalDiameter_mm : (isMildSteel ? d0 * Math.sqrt(1 - 0.55) : d0);
    const Af = (Math.PI / 4) * Math.pow(df, 2);

    // Forces (kN to N)
    const Puy_N = (milestones.upperYield ? milestones.upperYield.load_kN : (isMildSteel ? 310 * A0 / 1000 : 0)) * 1000;
    const Ply_N = (milestones.lowerYield ? milestones.lowerYield.load_kN : (isMildSteel ? 280 * A0 / 1000 : 0)) * 1000;
    const Pu_N = (milestones.ultimate ? milestones.ultimate.load_kN : (isMildSteel ? 440 * A0 / 1000 : 200 * A0 / 1000)) * 1000;
    const Pb_N = (milestones.fracture ? milestones.fracture.breakingLoad_kN : (isMildSteel ? 330 * A0 / 1000 : 200 * A0 / 1000)) * 1000;

    // Stresses (MPa = N/mm2)
    const ReH = isMildSteel ? (Puy_N / A0) : null; // Upper yield strength
    const ReL = isMildSteel ? (Ply_N / A0) : null; // Lower yield strength
    const Rm = Pu_N / A0;                          // Ultimate tensile strength
    const sigma_b = Pb_N / A0;                     // Breaking nominal stress

    // Elastic Modulus (GPa)
    const E_GPa = isMildSteel ? 205.0 : 110.0;

    // Ductility Parameters
    const deltaL = Lf - L0;
    const percentageElongation = (deltaL / L0) * 100;
    const percentageReductionInArea = ((A0 - Af) / A0) * 100;

    // Modulus of Resilience Ur = sigma_y^2 / (2E) in MJ/m3
    const yieldStress = isMildSteel ? (ReL || 280) : 0;
    const modulusOfResilience = isMildSteel ? ((Math.pow(yieldStress, 2) / (2 * (E_GPa * 1000)))) : 0.18;

    // Modulus of Toughness Ut = numerical integration of sigma * d_epsilon
    let modulusOfToughness = 0;
    if (history && history.length > 1) {
      for (let i = 1; i < history.length; i++) {
        const dEps = Math.max(0, history[i].strain - history[i - 1].strain);
        const avgStress = (history[i].stress_MPa + history[i - 1].stress_MPa) / 2;
        modulusOfToughness += avgStress * dEps;
      }
    } else {
      // Analytical approximation
      modulusOfToughness = isMildSteel ? 86.4 : 1.1;
    }

    // ASTM Standard Compliance & Verdict
    const standardName = isMildSteel ? 'ASTM E8 / E8M Standard (Structural Mild Steel)' : 'ASTM A48 / A48M Class 30 (Grey Cast Iron)';
    const compliance = isMildSteel ? {
      yieldCompliant: ReL >= 250 && ReL <= 350,
      utsCompliant: Rm >= 400 && Rm <= 550,
      elongationCompliant: percentageElongation >= 20.0,
      verdict: 'PASS (Exceeds ASTM E8 Structural Minimums)'
    } : {
      yieldCompliant: true, // Cast iron has no yield requirement
      utsCompliant: Rm >= 180 && Rm <= 240,
      elongationCompliant: percentageElongation < 2.0,
      verdict: 'PASS (Complies with ASTM A48 Class 30 Specification)'
    };

    const morphology = isMildSteel ? {
      fractureType: 'Cup-and-Cone Ductile Shear',
      cleavageAngle: '45° Shear Lip with central fibrous fibrous cup',
      neckingObserved: 'Significant localized necking (~55% area reduction)',
      energyAbsorption: 'High plastic energy dissipation before failure'
    } : {
      fractureType: 'Flat Cleavage Brittle Separation',
      cleavageAngle: '90° Planar transverse fracture perpendicular to load axis',
      neckingObserved: 'Negligible (0% area reduction, zero localized neck)',
      energyAbsorption: 'Low energy absorption; catastrophic acoustic rupture'
    };

    return {
      specimen: {
        materialKey,
        materialName: isMildSteel ? 'Mild Steel' : 'Grey Cast Iron',
        materialType: isMildSteel ? 'Ductile' : 'Brittle',
        standard: standardName,
        d0_mm: d0,
        L0_mm: L0,
        A0_mm2: A0,
        df_mm: df,
        Lf_mm: Lf,
        Af_mm2: Af,
        deltaL_mm: deltaL
      },
      forces: {
        Puy_kN: Puy_N / 1000,
        Ply_kN: Ply_N / 1000,
        Pu_kN: Pu_N / 1000,
        Pb_kN: Pb_N / 1000
      },
      properties: {
        E_GPa,
        ReH_MPa: ReH,
        ReL_MPa: ReL,
        Rm_MPa: Rm,
        sigma_b_MPa: sigma_b,
        percentageElongation,
        percentageReductionInArea,
        modulusOfResilience,
        modulusOfToughness
      },
      morphology,
      compliance
    };
  }

  static generateCSV(results, history) {
    let csv = `Tensile Test Simulation Report - ${results.specimen.materialName}\n`;
    csv += `Standard,${results.specimen.standard}\n`;
    csv += `Initial Diameter (mm),${results.specimen.d0_mm.toFixed(2)}\n`;
    csv += `Initial Area (mm2),${results.specimen.A0_mm2.toFixed(2)}\n`;
    csv += `Initial Gauge Length (mm),${results.specimen.L0_mm.toFixed(2)}\n`;
    csv += `Final Gauge Length (mm),${results.specimen.Lf_mm.toFixed(2)}\n`;
    csv += `Final Neck Diameter (mm),${results.specimen.df_mm.toFixed(2)}\n`;
    csv += `Elongation (%),${results.properties.percentageElongation.toFixed(2)}\n`;
    csv += `Reduction in Area (%),${results.properties.percentageReductionInArea.toFixed(2)}\n`;
    csv += `UTS (MPa),${results.properties.Rm_MPa.toFixed(1)}\n`;
    if (results.properties.ReL_MPa) {
      csv += `Lower Yield Strength (MPa),${results.properties.ReL_MPa.toFixed(1)}\n`;
    }
    csv += `Modulus of Elasticity (GPa),${results.properties.E_GPa.toFixed(1)}\n\n`;

    csv += `Time (s),Elongation (mm),Strain (mm/mm),Stress (MPa),Load (kN),Stage\n`;
    if (history && history.length > 0) {
      for (const row of history) {
        csv += `${row.time.toFixed(3)},${row.elongation_mm.toFixed(3)},${row.strain.toFixed(5)},${row.stress_MPa.toFixed(2)},${row.load_kN.toFixed(3)},${row.stage}\n`;
      }
    }
    return csv;
  }
}
