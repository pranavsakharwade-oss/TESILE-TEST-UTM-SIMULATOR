# Project Title

TENSILE TEST SIMULATOR

## Problem Statement Fit

Our project addresses the problem of limited access to physical Universal Testing Machines (UTM) and the difficulty students face in understanding tensile testing through theory alone. The 3D UTM Simulator provides a virtual environment where users can understand the machine components, testing procedure, specimen deformation, and test parameters through an interactive simulation.

## Target Users

The primary users are mechanical engineering students, diploma students, educators, and beginners learning about material testing. The simulator is especially useful for students who have limited access to laboratory equipment or want to understand the UTM procedure before performing a physical experiment.

## What We Built

We built an interactive 3D Universal Testing Machine (UTM) simulator that digitally represents the machine and its tensile testing process. Users can interact with the virtual machine, understand its major components, perform a simulated tensile test, and observe parameters such as load, displacement, stress, and strain. The simulation provides a safe and accessible alternative for learning the fundamentals of tensile testing.

## Core Features
- Interactive 3D model of a Universal Testing Machine
- Virtual tensile testing procedure
- Visualization of specimen loading and deformation
- Display of load and displacement values
- Calculation/visualization of stress and strain
- Easy-to-understand user interface
- Safe virtual environment for learning and experimentation
- Helps students understand UTM components and working principles

## Technical Architecture

The simulator uses a decoupled, event-driven architecture. User interactions through mouse, touch, and keyboard inputs are handled by an EventBus and connected to the StateMachine and InteractionRig.

The application is divided into four main subsystems:

- Core System: EventBus, StateMachine, and application coordination.
- Mechanical Physics Engine: Calculates tensile-test behaviour, including stress, strain, load, elongation, yielding, strain hardening, necking, and fracture.
- Three.js 3D System: Handles the UTM machine, specimen, Vernier caliper, laboratory environment, camera, lighting, and interactive objects.
- UI/HUD System: Displays live telemetry, controls, measurements, graphs, and final test results.

The tensile-test workflow is controlled through a 13-state finite state machine, beginning with specimen selection and initial measurement and ending with final measurement and the results report. The physics engine continuously sends test data through the EventBus to the 3D scene, telemetry displays, and real-time charts. The 3D environment is rendered using WebGL2 through Three.js. 

## Tech Stack

- **JavaScript (ES6+)** — Application logic, simulation control, state management, and interaction logic
- **Three.js** — 3D UTM environment, machine components, specimen, Vernier caliper, camera, lighting, and scene rendering
- **WebGL2** — Hardware-accelerated 3D rendering
- **HTML5** — Application structure and interface shell
- **CSS3** — HUD, controls, layouts, telemetry panels, and visual styling
- **Vite** — Development server and project build system
- **Canvas API** — Real-time Load–Elongation and Stress–Strain charts
- **Raycasting** — Object selection, drag-and-drop interaction, and Vernier caliper contact detection
- **JavaScript-based Physics Engine** — Tensile-test calculations and material behaviour simulation

## Innovation / Uniqueness

The project combines 3D visualization with engineering education to make UTM testing easier to understand. Instead of relying only on diagrams or theoretical explanations, students can observe and interact with a virtual machine and visualize the testing process. This approach can help bridge the gap between theoretical knowledge and practical laboratory experience.

## Demo Instructions

1. Launch the Tensile Test Simulator in the browser.
2. Select the required test specimen.
3. Inspect the specimen and activate the Vernier caliper.
4. Move the 3D Vernier caliper and record the initial diameter and gauge length.
5. Drag the specimen from the workbench and position it between the UTM grips.
6. Clamp the specimen and use the Tare/Zero control.
7. Start the tensile test.
8. Observe the live load, displacement, stress, and strain values.
9. Watch the specimen progress through elastic deformation, yielding, strain hardening, necking, and fracture.
10. After fracture, use the Vernier caliper to record the final measurements.
11. Open the results section to view the calculated test results and graphs.
12. Use Reset/Retest to run the experiment again.

## Known Limitations

- The tensile-test physics and material response are simulated using mathematical models and simplified assumptions.
- The 3D simulation is designed for educational purposes and should not be considered a replacement for certified laboratory testing or real experimental measurements.

## Future Work

Future versions can include additional material types, different testing modes such as compression and bending tests, more detailed stress-strain graphs, realistic material failure behaviour, experimental data export, virtual laboratory assessments, and improved interaction with individual UTM components. The simulator can also be expanded into a complete virtual materials-testing laboratory.