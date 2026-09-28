# UI/UX & Visual Design Specification

## 3D Virtual Universal Testing Machine (UTM) Simulation (Clean Light Laboratory)

---

## 1. Design Philosophy: Clean Light Laboratory & Technical Precision

The visual design is engineered to replicate the atmosphere of a modern **ISO-certified materials testing and metrology laboratory**:

- **Clean Light Palette**: Crisp off-white and soft porcelain backgrounds (`#f8fafc` / `#f1f5f9`), solid white docked panels (`#ffffff`), and brushed silver/aluminum metal textures.
- **Flush Edge-to-Edge Workspace**: Top bar, right sidebar, and bottom console are cleanly docked to the viewport edges without bulbous floating margins or pill borders.
- **High-Contrast Digital Instrumentation**: High-contrast dark charcoal/navy ink readouts (`#0f172a`) on recessed pale titanium gauge beds with vivid technical color coding.
- **Unified Typography (100% Manrope)**: Exclusive use of **Manrope** across every interface element — headers, instructions, digital gauges (using OpenType `tabular-nums` for rock-solid zero-jitter readouts), buttons, and scale marks.

---

## 2. Design Tokens

### 2.1 Color Palette & Typography

```css
:root {
  --bg-app-shell:        #ffffff;
  --bg-viewport:         #f1f5f9;
  --bg-panel:            #ffffff;
  --bg-subtle:           #f8fafc;
  --bg-input:            #f1f5f9;

  --border-subtle:       #e2e8f0;
  --border-strong:       #cbd5e1;
  --border-focus:        #0284c7;

  --accent-primary:      #0284c7;
  --status-ready:        #16a34a;
  --status-warning:      #d97706;
  --status-danger:       #dc2626;

  --text-main:           #0f172a;
  --text-muted:          #475569;
  --text-caption:        #94a3b8;

  --font-family:         'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-sans:           var(--font-family);
  --font-mono:           var(--font-family);
}
```

### 2.2 Typography Scale (100% Roboto)

| Role | Font Family | Weight | OpenType Features | Use Case |
|---|---|---|---|---|
| **App Title & Headers** | `'Roboto', sans-serif` | 700, 800 | standard | Branding, section titles, modal headers |
| **Digital Readouts** | `'Roboto', sans-serif` | 700 | `tabular-nums` | Load ($kN$), Stroke ($mm$), Stress ($MPa$), Strain |
| **Buttons & Action Controls** | `'Roboto', sans-serif` | 700 | standard | Start, Tare, Record, Reset, E-Stop |
| **Body & UI Instructions** | `'Roboto', sans-serif` | 400, 500 | standard | Instructions, tooltips, parameter descriptions |
| **Vernier Ticks & Scales** | `'Roboto', sans-serif` | 500 | `tabular-nums` | Metric scale markings and coinciding line numbers |

---

## 3. Spatial Layout & Viewport Ergonomics

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TOP STATUS BAR: Mode Toggle (Guided/Assess) | Step Progress (1-13) | Audio  │
├──────────────────────────────────────────────────────┬──────────────────────┤
│                                                      │ RIGHT TELEMETRY POD  │
│                                                      │                      │
│                                                      │ 1. Rod Selection     │
│             MAIN 3D VIEWPORT                         │    (8, 10, 12 mm)    │
│             (Daylight Studio Environment)            │ 2. Matched Machine   │
│             • 3D UTM Machine Rig                     │    Capacity Info     │
│             • Specimen Drag & Drop Snap Zone         │ 3. Digital Readouts  │
│             • Interactive Vernier Caliper            │    (P, ΔL, σ, ε)     │
│             • Camera Presets [1:All | 2:UTM | 3:Lab] │ 4. Live Charts:      │
│                                                      │    • Load vs ΔL      │
│                                                      │    • Stress vs Strain│
│                                                      │                      │
├──────────────────────────────────────────────────────┴──────────────────────┤
│ BOTTOM INDUSTRIAL CONTROL CONSOLE:                                           │
│ [Start Test]  [Tare / Zero]  [Record Measure]  [Reset]  [EMERGENCY STOP (🔴)] │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Visual Specifications

### 4.1 Specimen Selection Cards
- **Dimensions**: $100\text{px} \times 84\text{px}$ card per rod.
- **States**:
  - *Default*: Pure white card, light border (`rgba(30, 41, 59, 0.15)`), soft drop shadow.
  - *Hover*: Sapphire blue border (`var(--led-cyan)`), subtle upward translate ($-2\text{px}$).
  - *Selected*: Sapphire border ring with subtle blue tint fill (`rgba(2, 132, 199, 0.08)`).

### 4.2 Digital Telemetry Gauges

```
┌─────────────────────────────────┐
│ LOAD                      [kN]  │
│  4 8 . 7 5                      │
└─────────────────────────────────┘
```
- Recessed pale titanium background (`hsl(215, 25%, 93%)`) with inner shadow.
- Large $21\text{px}$ bold **Roboto** digits formatted with `font-variant-numeric: tabular-nums` in high-contrast charcoal (`#1e293b`).
- Unit indicator rendered in subdued secondary text (`#64748b`).

### 4.3 Vernier Caliper Magnifier Loupe (HUD Lens)
- **Optical Simulation**: $4\times$ zoom on the coincidence point between the main beam scale ($1\text{ mm}$ pitch) and sliding vernier plate ($0.02\text{ mm}$ pitch).
- **Scale Face**: Clean matte white brushed plate with precision black tick markings and bold Roboto numeric division labels.
- **Interactive Thumb Wheel**: Allows fine-tuning adjustments of $\pm 0.02\text{ mm}$.
