/**
 * MaterialConstants.js
 * Constitutive properties for Mild Steel (Ductile) and Grey Cast Iron (Brittle)
 * in accordance with ASTM E8 / ASTM A48 / ISO 6892-1 / ISO 185
 */

export const MATERIALS = {
  MILD_STEEL: {
    id: 'MILD_STEEL',
    name: 'Mild Steel',
    type: 'Ductile',
    colorHex: 0xa0aec0,
    metalness: 0.7,
    roughness: 0.35,
    youngsModulus_GPa: 200,      // E in GPa
    yieldStress_MPa: 280,         // Lower Yield Stress
    upperYieldStress_MPa: 310,    // Upper Yield Stress
    ultimateStress_MPa: 440,      // UTS
    fractureStress_MPa: 330,      // Nominal engineering breaking stress
    fractureStrain: 0.24,         // 24% elongation
    reductionInArea: 0.55,        // 55% RA
    hasYieldPlateau: true,
    hasNecking: true,
    fractureType: 'Cup-and-Cone (45° Shear Lip)',
    description: 'Ductile structural steel. Shows distinct upper/lower yield points, extensive strain hardening, localized necking, and classic cup-and-cone ductile fracture.'
  },
  GREY_CAST_IRON: {
    id: 'GREY_CAST_IRON',
    name: 'Grey Cast Iron',
    type: 'Brittle',
    colorHex: 0x4a5568,           // Darker graphite-grey matte
    metalness: 0.25,
    roughness: 0.75,
    youngsModulus_GPa: 110,       // E in GPa (Secant modulus)
    yieldStress_MPa: null,        // No distinct yield point
    upperYieldStress_MPa: null,
    ultimateStress_MPa: 200,      // UTS in tension (Grade 200/250)
    fractureStress_MPa: 200,      // Fracture occurs at UTS (Brittle)
    fractureStrain: 0.008,        // 0.8% elongation (virtually zero plastic stretch)
    reductionInArea: 0.01,        // ~0% RA (No necking)
    hasYieldPlateau: false,
    hasNecking: false,
    fractureType: 'Flat Cleavage (90° Transverse Brittle)',
    description: 'Brittle iron with graphite flakes acting as internal stress raisers. Weak in tension, shows no necking, no yield plateau, and fails abruptly along a flat 90° cleavage plane.'
  }
};

export const SPECIMEN_RODS = [
  { id: 8, diameter_mm: 8, gaugeLength_mm: 300 },
  { id: 10, diameter_mm: 10, gaugeLength_mm: 300 },
  { id: 12, diameter_mm: 12, gaugeLength_mm: 300 }
];

export function getMatchedUTMCapacity(diameter_mm, materialId) {
  const mat = MATERIALS[materialId] || MATERIALS.MILD_STEEL;
  const area_mm2 = (Math.PI / 4) * Math.pow(diameter_mm, 2);
  const peakForce_kN = (mat.ultimateStress_MPa * area_mm2) / 1000;

  if (peakForce_kN <= 35) {
    return {
      capacity_kN: 50,
      capacityTons: 5,
      driveType: 'Electromechanical',
      peakForce_kN: peakForce_kN.toFixed(1),
      application: 'Thin wires, fasteners, plastics, light bars (Up to 8 mm)'
    };
  } else {
    return {
      capacity_kN: 100,
      capacityTons: 10,
      driveType: 'Electromechanical / Hydraulic',
      peakForce_kN: peakForce_kN.toFixed(1),
      application: 'Structural rebars, shafts, cast test coupons (Up to 12 mm)'
    };
  }
}
