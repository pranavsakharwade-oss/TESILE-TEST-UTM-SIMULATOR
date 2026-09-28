# Mechanical Engineering Laboratory Manual

## Experiment: Uniaxial Tension Test of Mild Steel Specimen Using a Universal Testing Machine (UTM)

---

## 1. Experiment Aim & Objectives

### 1.1 Aim
To conduct a uniaxial tensile test on a mild steel rod specimen using a Universal Testing Machine (UTM) and determine its mechanical properties:
1. Young's Modulus ($E$)
2. Yield Stress ($\sigma_y$)
3. Ultimate Tensile Strength ($\sigma_u$)
4. Breaking Stress ($\sigma_b$)
5. Percentage Elongation ($\%El$)
6. Percentage Reduction in Area ($\%RA$)

### 1.2 Learning Objectives
- Master the manual metrology procedure using a 3D Vernier caliper to measure initial and final dimensions.
- Understand the safe manual mounting and hydraulic wedge clamping procedure on a UTM.
- Observe real-time continuous deformation behavior: Elastic deformation, Lüders band yield plateau, strain hardening, necking instability, and ductile fracture.
- Generate and analyze the Load vs. Elongation ($P\text{–}\Delta L$) and Engineering Stress vs. Strain ($\sigma\text{–}\varepsilon$) curves.

---

## 2. Apparatus & Tools Required

1. **Universal Testing Machine (UTM)**:
   - Capacity: $50\text{ kN}$ (Electromechanical) or $100\text{ kN}$ (Hydraulic drive).
   - Movable crosshead, upper and lower hydraulic wedge grips, digital load cell transducer, and optical displacement encoder.
2. **Mild Steel Cylindrical Specimen**:
   - Nominal Diameters: $8\text{ mm}$, $10\text{ mm}$, or $12\text{ mm}$.
   - Gauge Length: $300\text{ mm}$ marked with two precision reference indentations.
3. **Metric Vernier Caliper**:
   - Range: $0\text{–}150\text{ mm}$ (Main Scale $1\text{ mm}$, Vernier Scale $50$ divisions, Least Count $= 0.02\text{ mm}$).
4. **Safety Equipment**: Safety glasses, machine safety interlock shields, Emergency Stop button.

---

## 3. Step-by-Step Experimental Procedure

### Step 1: Specimen Selection
- In the right-hand control panel, review the available mild steel specimens ($8\text{ mm}$, $10\text{ mm}$, or $12\text{ mm}$).
- Select the rod diameter. Note how the matched machine capacity and drive type update automatically.

### Step 2: Specimen Inspection
- Inspect the rod on the inspection bench.
- Verify the nominal diameter and confirm the two marked gauge reference lines spaced $300\text{ mm}$ apart.

### Step 3: Initial Metrology (Vernier Caliper)
- Pick up the 3D Vernier caliper from the workbench.
- Measure the **Initial Diameter ($d_0$)** at three points along the gauge section by closing the caliper jaws squarely around the rod cross-section. Click **Record Measurement** to log $d_0$.
- Measure the **Initial Gauge Length ($L_0$)** by spanning the caliper jaws between the two marked reference lines. Click **Record Measurement** to log $L_0 \approx 300\text{ mm}$.

### Step 4: Specimen Mounting (Drag and Drop)
- Left-click and drag the measured specimen from the workbench toward the UTM test zone.
- Align the specimen within the vertical snap highlight between the upper and lower grip assemblies.
- Release to drop the specimen into position. The hydraulic clamping jaws will close inward to clamp the specimen firmly.

### Step 5: Machine Zero / Tare
- With the specimen securely gripped, press the **Tare / Zero** button on the control console.
- Confirm that both the digital Load readout ($0.00\text{ kN}$) and Elongation readout ($0.00\text{ mm}$) are zeroed to eliminate dead-load offsets.

### Step 6: Apply Tensile Load
- Ensure all safety guards are clear and press **Start Test**.
- The crosshead begins kinematic displacement at standard tensile rate ($1.5\text{ mm/min}$).
- Observe the live digital gauges for Load, Elongation, Stress, and Strain, and monitor the real-time curve plotting.

### Step 7: Elastic Region (Hooke's Law)
- Watch the initial linear segment of the curve. Record the slope representing Young's modulus ($E$). Specimen stretches uniformly and reversibly.

### Step 8: Yield Phenomenon
- Observe the sudden transition where load flattens and oscillates slightly (Upper Yield Point $\to$ Lower Yield Point).
- The system automatically captures the **Yield Load ($P_y$)**.

### Step 9: Strain Hardening & Ultimate Tensile Load
- As dislocations multiply, the load increases to a maximum peak.
- The highest load sustained is logged as the **Ultimate Load ($P_u$)**.

### Step 10: Necking Instability
- Past the peak, notice the localized reduction in diameter near the center of the gauge length.
- The load reading starts dropping steadily even though crosshead elongation continues.

### Step 11: Ductile Fracture
- The specimen fractures suddenly with an audible acoustic release.
- The system records the **Breaking Load ($P_b$)**. The machine crosshead halts automatically.
- Observe the classic cup-and-cone morphology on the fracture surfaces.

### Step 12: Post-Fracture Metrology
- Re-engage the 3D Vernier caliper.
- Re-join the two fractured halves together and measure the **Final Gauge Length ($L_f$)** between the gauge lines.
- Measure the **Final Neck Diameter ($D_n$)** at the narrowest fractured waist.
- Click **Record Measurement** for both final dimensions.

### Step 13: Results & Lab Report
- Click **Generate Lab Report** to view the full tabulated performance card, calculated mechanical properties, and exported PDF report.

---

## 4. Student Observation Table

| Parameter | Symbol | Nominal Value | Observed Value (Student) | Unit |
|---|---|---|---|---|
| Initial Diameter | $d_0$ | $10.0$ | | $\text{mm}$ |
| Initial Gauge Length | $L_0$ | $300.0$ | | $\text{mm}$ |
| Initial Cross-Sectional Area | $A_0 = \frac{\pi}{4} d_0^2$ | $78.54$ | | $\text{mm}^2$ |
| Yield Load | $P_y$ | $\sim 22.0$ | | $\text{kN}$ |
| Ultimate Tensile Load | $P_u$ | $\sim 34.6$ | | $\text{kN}$ |
| Breaking Load | $P_b$ | $\sim 25.9$ | | $\text{kN}$ |
| Final Gauge Length | $L_f$ | $\sim 372.0$ | | $\text{mm}$ |
| Final Neck Diameter | $D_n$ | $\sim 6.71$ | | $\text{mm}$ |
| Final Cross-Sectional Area | $A_f = \frac{\pi}{4} D_n^2$ | $\sim 35.37$ | | $\text{mm}^2$ |

---

## 5. Sample Calculations (For $10\text{ mm}$ Mild Steel Rod)

1. **Original Area ($A_0$)**:
   $$A_0 = \frac{\pi}{4} (10.0)^2 = 78.54\text{ mm}^2$$

2. **Final Neck Area ($A_f$)**:
   $$A_f = \frac{\pi}{4} (6.71)^2 = 35.37\text{ mm}^2$$

3. **Percentage Elongation ($\%El$)**:
   $$\%El = \left(\frac{372.0 - 300.0}{300.0}\right) \times 100 = \frac{72.0}{300.0} \times 100 = 24.0\%$$

4. **Percentage Reduction in Area ($\%RA$)**:
   $$\%RA = \left(\frac{78.54 - 35.37}{78.54}\right) \times 100 = 54.97\%$$

5. **Yield Stress ($\sigma_y$)**:
   $$\sigma_y = \frac{P_y}{A_0} = \frac{22,000\text{ N}}{78.54\text{ mm}^2} = 280.1\text{ N/mm}^2\text{ (MPa)}$$

6. **Ultimate Tensile Strength ($\sigma_u$)**:
   $$\sigma_u = \frac{P_u}{A_0} = \frac{34,560\text{ N}}{78.54\text{ mm}^2} = 440.0\text{ N/mm}^2\text{ (MPa)}$$

7. **Breaking Stress ($\sigma_b$)**:
   $$\sigma_b = \frac{P_b}{A_f} = \frac{25,920\text{ N}}{35.37\text{ mm}^2} = 732.8\text{ N/mm}^2\text{ (True Breaking Stress)}$$
   $$\sigma_{b,\text{eng}} = \frac{P_b}{A_0} = \frac{25,920\text{ N}}{78.54\text{ mm}^2} = 330.0\text{ N/mm}^2\text{ (Engineering Breaking Stress)}$$

8. **Young's Modulus ($E$)**:
   $$E = \frac{\sigma_{\text{elastic}}}{\varepsilon_{\text{elastic}}} = \frac{200\text{ MPa}}{0.001} = 200,000\text{ MPa} = 200\text{ GPa}$$

---

## 6. Viva-Voce Questions & Model Answers

**Q1: Why is the engineering breaking stress lower than the ultimate tensile strength?**  
*Answer:* In engineering stress calculations, the load is divided by the *original* area $A_0$. Because severe localized necking reduces the load-bearing area before fracture, the machine requires less total force to continue elongating the necked zone, causing the nominal engineering stress to drop. In contrast, the *true* stress (force divided by instantaneous neck area $A_f$) continues to rise monotonically up to fracture.

**Q2: What is the physical mechanism causing the yield plateau in mild steel?**  
*Answer:* It is caused by dislocation unpinning from interstitial solute atoms (carbon and nitrogen), known as **Cottrell atmospheres**. Once unpinned at the upper yield point, dislocations move rapidly at a lower stress level, propagating macroscopic slip bands (**Lüders bands**) across the gauge section until strain hardening begins.

**Q3: What causes the cup-and-cone fracture surface appearance?**  
*Answer:* Tensile hydrostatic stress in the center of the neck causes microvoids to nucleate and coalesce into an internal fibrous flat crack normal to the tensile axis ("cup" center). As the crack approaches the outer surface, plane stress conditions dominate, and final failure occurs by shear sliding along the maximum shear stress planes inclined at $45^\circ$ ("shear lips").

**Q4: What is the Least Count of the Vernier caliper used, and how is it calculated?**  
*Answer:* The Least Count is $0.02\text{ mm}$. It is determined as:
$$LC = 1\text{ Main Scale Division (MSD)} - 1\text{ Vernier Scale Division (VSD)} = 1.00\text{ mm} - \frac{49}{50}\text{ mm} = 0.02\text{ mm}$$
