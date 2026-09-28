# Interactive 3D Virtual Tensile Test Machine Simulation
### Mechanical Engineering Laboratory Experiment — Full Specification

---

## 1. OBJECTIVE

Build an interactive, realistic 3D virtual **Universal Testing Machine (UTM)** simulation that lets a student perform a complete tensile test — from **selecting a rod specimen**, **measuring it with a Vernier caliper**, **manually mounting it on the UTM**, **applying load**, through to **fracture** and **final result calculation**.

---

## 2. SPECIMEN SELECTION (NEW)

Before the test begins, the user must **select the type of rod** they want to test. Three rod options are available:

| Rod Option | Diameter (d₀) | Gauge Length (L₀) | Material |
|---|---|---|---|
| Rod 1 | 8 mm | 300 mm | Mild Steel |
| Rod 2 | 10 mm | 300 mm | Mild Steel |
| Rod 3 | 12 mm | 300 mm | Mild Steel |

- Present the three rods as selectable 3D thumbnails/cards (with diameter labeled).
- Once selected, the rod's specimen model (cylindrical, with two gauge marks 300 mm apart) loads into the scene.
- Selecting a rod must **automatically populate the appropriate UTM machine information** based on the table below (matched from the user-provided machine capacity chart).

### 2.1 Auto-Populated Machine Info per Rod (from Machine Capacity Chart)

| Rod Diameter | Matched Machine Capacity | Main Drive Type | Typical Max Rod Diameter (Mild Steel/Rebar) | Common Application |
|---|---|---|---|---|
| 8 mm | 50 kN (5 Tons) | Electromechanical | Up to 8 mm | Thin wires, fasteners, plastics |
| 10 mm | 100 kN (10 Tons) | Electromechanical / Hydraulic | Up to 12 mm | Small construction rebars, wires |
| 12 mm | 100 kN (10 Tons) | Electromechanical / Hydraulic | Up to 12 mm | Small construction rebars, wires |

**Full reference chart (for UI info panel):**

| Machine Capacity (kN) | Main Drive Type | Typical Max Rod Diameter | Common Application |
|---|---|---|---|
| 50 kN (5 Tons) | Electromechanical | Up to 8 mm | Thin wires, fasteners, plastics |
| 100 kN (10 Tons) | Electromechanical / Hydraulic | Up to 12 mm | Small construction rebars, wires |
| 300 kN (30 Tons) | Hydraulic | Up to 20 mm | Standard residential structural rods |
| 500 kN (50 Tons) | Hydraulic | Up to 26 mm | Commercial construction steel bars |
| 600 kN (60 Tons) | Hydraulic | Up to 32 mm | Heavy civil infrastructure testing |
| 1000 kN (100 Tons) | Heavy Hydraulic | Up to 40–42 mm | Mega bridges, highways, dams |

- Display the matched machine's **capacity, drive type, and application** in the right info panel immediately after rod selection.
- This info panel stays visible throughout the test as reference/context for the student.

---

## 3. SPECIMEN GEOMETRY

- Standard cylindrical tensile-test specimen with a reduced gauge section.
- Gauge length (L₀) = 300 mm (per selected rod) — clearly marked with two reference lines exactly 300 mm apart.
- Diameter (d₀) = 8 / 10 / 12 mm depending on selection.
- All dimensions displayed in mm on the 3D model.

---

## 4. VERNIER CALIPER — INTERACTIVE MEASUREMENT

A fully interactive 3D Vernier caliper must be included with the following behavior:

1. User can **pick up and move** the caliper freely in the 3D scene.
2. User positions the caliper jaws around the specimen (diameter) or against the gauge marks (length).
3. Jaws **open/close** via mouse drag or touch gesture — physically animated, not automatic.
4. Diameter measurement performed by closing jaws around the rod cross-section.
5. Gauge-length measurement performed by spanning the two marked points.
6. Main scale + vernier (sliding) scale rendered clearly and legibly, with tick marks.
7. The displayed reading updates **dynamically and only** based on actual jaw position (no auto-fill).
8. A small **realistic measurement error** is allowed depending on how precisely the user aligns the jaws (e.g. ±0.02–0.1 mm).
9. **"Record Measurement"** button saves the current reading into the lab report.
10. Caliper is reused **after fracture** to measure the final (necked) gauge length and final neck diameter — same manual interaction, no auto-values.

---

## 5. MANUAL DRAG-AND-DROP MOUNTING (NEW)

Unlike an automatic mount, the user must **physically drag and drop** the specimen onto the UTM:

1. After measurement is recorded, the specimen becomes **draggable**.
2. User drags the specimen from the inspection area toward the UTM's grip zone.
3. A visual snap-guide/highlight shows the correct alignment position between upper and lower grips.
4. On release near the correct position, the specimen **snaps into place**; if dropped incorrectly, it stays in the free zone and the user must retry.
5. Once aligned, the **upper and lower grips visibly clamp** shut on the specimen (animated jaw closing).
6. Only after a successful clamp does the "Start Test" control become enabled.

---

## 6. TENSILE TEST MACHINE (UTM) — 3D COMPONENTS

- Upper grip (clamps top of specimen)
- Lower grip (clamps bottom of specimen)
- Tensile specimen (selected rod)
- Hydraulic/loading mechanism (visibly actuates)
- Load display (digital readout, kN)
- Displacement/elongation display (digital readout, mm)
- Control panel
- Start / Stop / Reset controls
- Emergency Stop button (large, red, always accessible)

---

## 7. STEP-WISE SIMULATION PROCEDURE

### STEP 1 — Rod Selection
User selects rod diameter (8 mm / 10 mm / 12 mm, all 300 mm gauge length). Matching UTM machine info auto-loads into the side panel.

### STEP 2 — Specimen Inspection
Display the selected specimen and its nominal dimensions (L₀, d₀) plus the UTM's capacity/drive-type info.

### STEP 3 — Vernier Caliper Measurement
User manually measures:
- Initial gauge length (≈ 300 mm, small realistic error)
- Initial diameter (≈ 8 / 10 / 12 mm, small realistic error)

User clicks **Record Measurement** to save each value.

### STEP 4 — Manual Mounting (Drag & Drop)
User drags the specimen from the bench and drops it between the UTM grips. Grips visibly clamp shut.

### STEP 5 — Zero / Reset
User presses **Zero/Reset** to remove any initial dead load / displacement offset before loading begins.

### STEP 6 — Apply Load
User presses **Start Test**. Load increases gradually. Real-time displays update:
- Load (kN)
- Elongation (mm)
- Stress (N/mm²)
- Strain

### STEP 7 — Elastic Region
Specimen elongates visibly; load increases approximately linearly with elongation (Hooke's Law region).

### STEP 8 — Yield Point
A visible yield stage occurs where load increase temporarily flattens/pauses. **Yield Load (Pᵧ)** is recorded automatically at this point.

### STEP 9 — Ultimate Load
Loading continues to the peak. **Ultimate Load (Pᵤ)** is recorded at the maximum point reached.

### STEP 10 — Necking
Beyond ultimate load, visible neck formation appears at a point on the gauge length; load gradually decreases while elongation continues.

### STEP 11 — Fracture
Specimen fractures realistically at the neck. **Breaking Load (Pᵦ)** is recorded at the point of fracture.

### STEP 12 — Post-Test Measurement
User manually re-uses the Vernier caliper to measure:
- Final gauge length (Lᶠ) — across the fractured/rejoined pieces
- Final neck diameter (Dₙ) — at the fracture point

Values recorded manually — not auto-filled.

### STEP 13 — Results & Report
System automatically calculates and displays the full lab report table and graphs (see Sections 8–9).

---

## 8. CALCULATIONS (AUTO-COMPUTED AFTER TEST)

| # | Quantity | Formula |
|---|---|---|
| 1 | Original area | A₀ = (π/4)·d₀² |
| 2 | Final area | Aᶠ = (π/4)·Dₙ² |
| 3 | Elongation | ΔL = Lᶠ − L₀ |
| 4 | Percentage elongation | % Elongation = [(Lᶠ − L₀)/L₀] × 100 |
| 5 | Percentage reduction in area | % RA = [(A₀ − Aᶠ)/A₀] × 100 |
| 6 | Yield stress | σᵧ = Pᵧ / A₀ |
| 7 | Ultimate tensile stress | σᵤ = Pᵤ / A₀ |
| 8 | Breaking stress | σᵦ = Pᵦ / Aᶠ |
| 9 | Strain | ε = ΔL / L₀ |
| 10 | Young's modulus | E = Stress / Strain (elastic region slope) |

---

## 9. GRAPHS

- **Load vs Elongation** (primary, real-time updating during test)
  - X-axis: Elongation (mm)
  - Y-axis: Load (kN)
- **Stress vs Strain** (optional secondary view)

Both graphs should visibly trace the elastic rise → yield plateau → ultimate peak → necking decline → fracture drop.

---

## 10. USER INTERFACE LAYOUT

### Left / Main Area
- Large interactive 3D UTM + specimen (with drag-and-drop zone and Vernier caliper workspace)

### Right Panel
- Rod selection cards (8 mm / 10 mm / 12 mm)
- Matched machine info (capacity, drive type, application)
- Vernier Caliper controls
- Measurement display
- Load / Elongation / Stress / Strain live readouts
- Test status indicator

### Bottom Control Bar
- Start Test
- Pause
- Reset
- Record Measurement
- Apply Load
- Emergency Stop

---

## 11. LAB REPORT (FINAL OUTPUT TABLE)

| Parameter | Value |
|---|---|
| Selected Rod Diameter | — |
| Machine Capacity Used | — |
| Original gauge length (L₀) | 300 mm |
| Original diameter (d₀) | 8 / 10 / 12 mm |
| Final gauge length (Lᶠ) | — |
| Final neck diameter (Dₙ) | — |
| Yield load | — |
| Ultimate load | — |
| Breaking load | — |
| Percentage elongation | — |
| Percentage reduction in area | — |
| Yield stress | — |
| Ultimate stress | — |
| Breaking stress | — |
| Young's modulus | — |

---

## 12. REALISM REQUIREMENTS

- Realistic metallic materials and mechanical animation.
- Specimen visibly elongates under load.
- Visible necking before fracture.
- Realistic grip clamping/unclamping motion.
- Vernier caliper jaws move physically and smoothly.
- Smooth 3D animation throughout (no instant/teleport transitions).
- Clear measurement labels and units at all times.
- Prevent physically impossible measurements (e.g. jaws can't measure negative or absurd values).
- Tooltips explaining each laboratory operation/step.

---

## 13. EDUCATIONAL MODES

- **Guided Mode:** highlights/animates the next required action for beginners (e.g. glowing outline on the caliper, arrow pointing to grips).
- **Assessment Mode:** hides step instructions; student must complete the full experiment independently, in correct order, to pass.

---

## 14. SUCCESS CONDITION

The experiment is considered complete only after the student has:

1. Selected a rod (8 mm / 10 mm / 12 mm).
2. Measured the initial specimen using the Vernier caliper.
3. Manually dragged and dropped the specimen to mount it on the UTM (grips clamp).
4. Applied tensile load.
5. Recorded the yield load.
6. Recorded the ultimate load.
7. Observed fracture.
8. Measured final dimensions using the Vernier caliper.
9. Viewed the calculated results table and graphs.

---

## 15. TARGET AUDIENCE

Designed for a **first-year Mechanical Engineering laboratory** — interactions should feel like operating an actual 3D tensile-testing machine, balancing realism with usability for beginners.
