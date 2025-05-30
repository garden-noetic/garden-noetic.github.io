# Interactive Platonic Solids Visualization

This project is an interactive 3D visualization of Platonic solids, built with Three.js and GSAP, and embedded within a Jekyll blog post. It allows users to view different Platonic solids, watch them morph between shapes, and adjust visual parameters like particle density (opacity) and brightness.

## Technologies Used

*   **Three.js:** A cross-browser JavaScript library/API used to create and display animated 3D computer graphics in a web browser.
*   **GSAP (GreenSock Animation Platform):** A JavaScript library for creating high-performance animations.
*   **Jekyll:** A static site generator used for the blog framework.

## File Structure and Components

The visualization consists of two main parts: the Jekyll blog post markdown file that provides the HTML structure and includes, and the JavaScript file that contains all the Three.js and interaction logic.

### 1. Blog Post (`_posts/YYYY-MM-DD-interactive-platonic-solids.md`)

This Markdown file is responsible for setting up the HTML environment where the Three.js visualization will live.

*   **HTML Structure:**
    *   Defines a main container `div` with the ID `platonic-solids-embed-container`.
    *   Inside this container, a `canvas` element with the ID `platonic-solids-canvas` is created. The Three.js scene is rendered onto this canvas.
*   **UI Elements:**
    *   `#shape-selector-container`: A `div` where shape selection buttons (e.g., "Tetrahedron", "Cube") are dynamically generated by `main.js`.
    *   `#density-slider`: An `<input type="range">` slider to control the apparent density of particles (by adjusting their opacity).
    *   `#density-value-label`: A `<span>` to display the current density level.
    *   `#brightness-slider`: An `<input type="range">` slider to control the brightness of the particle colors.
    *   `#brightness-value-label`: A `<span>` to display the current brightness level.
    *   `#recenter-button`: A button (⌖ icon) to reset the camera view to its initial position.
*   **Script Loading:**
    *   Loads external libraries (Three.js, GSAP, OrbitControls.js) from CDNs.
    *   Includes the main application logic script using Jekyll's `relative_url` filter: `{{ '/assets/js/platonic-solids/main.js' | relative_url }}`.

### 2. Main JavaScript (`assets/js/platonic-solids/main.js`)

This file contains the core logic for the visualization.

*   **Setup & Initialization:**
    *   Initializes the Three.js `Scene`, `PerspectiveCamera`, and `WebGLRenderer`.
    *   Sets up `OrbitControls` for camera manipulation (zoom, pan, rotate).
    *   Creates the particle system using `THREE.BufferGeometry` and `THREE.PointsMaterial`. The particles are stored in a `THREE.Points` object.
*   **Platonic Solids Data:**
    *   Includes pre-defined vertex data arrays (`tetrahedronVertices`, `cubeVertices`, etc.) for each of the five Platonic solids.
    *   `platonicSolidsData`: An array of objects, where each object contains the name and vertex generation function for a solid.
*   **Particle Generation & Management:**
    *   `PARTICLE_COUNT`: A constant defining the total number of particles in the system (currently set to 12000).
    *   `generatePlatonicSolidVertices(solidVertices, scale)`: A function that maps the `PARTICLE_COUNT` particles to the surface of a given Platonic solid by distributing them among its triangles.
    *   `generateSphereExplodePositions(radius)`: Generates random particle positions on the surface of a sphere, used for the "explode" phase of the morph animation.
    *   `positions` attribute of the particle geometry is updated dynamically during morphing.
*   **Animation (`startMorph(targetShapeIndex)`):**
    *   The core animation logic, driven by GSAP's timeline feature.
    *   When a new shape is selected, this function is called.
    *   It creates two sets of target positions:
        1.  `explodePositions`: Particles move outwards to form a sphere.
        2.  `targetPositions`: Particles then move from the sphere to form the new Platonic solid.
    *   A GSAP timeline animates the `x`, `y`, and `z` coordinates of each particle from its current position to the `explodePositions`, and then to the `targetPositions`.
    *   Easing functions (`circ.out`, `circ.in`) are used for smooth transitions.
    *   `MORPH_DURATION` and `EXPLODE_SCALE` control the animation's timing and extent.
*   **Color Themes:**
    *   `colorThemes`: An object defining various color palettes (e.g., `gold`, `emerald`, `rainbow`).
    *   `applyColorTheme(themeName)`: Applies the selected color theme to the particles. For the rainbow theme, colors are distributed based on particle index. The selected brightness level also modifies the final colors.
*   **UI Controls and Event Handling:**
    *   **Shape Selection:**
        *   Dynamically creates buttons for each Platonic solid and appends them to `#shape-selector-container`.
        *   Event listeners on these buttons call `startMorph()` with the appropriate `targetShapeIndex`.
    *   **Density Slider:**
        *   `DENSITY_LEVELS`: An object mapping descriptive keys (e.g., "low", "medium", "high") to opacity values.
        *   The slider's `input` event updates `currentDensityKey`, changes `particles.material.opacity`, and updates the `#density-value-label`.
    *   **Brightness Slider:**
        *   `BRIGHTNESS_LEVELS`: An object mapping descriptive keys to brightness multiplier values.
        *   The slider's `input` event updates `currentBrightnessKey`, re-applies the current color theme (which incorporates the new brightness), and updates the `#brightness-value-label`.
    *   **Recenter Button:**
        *   An event listener on `#recenter-button` calls `orbitControls.reset()` to reset the camera.
    *   The script initializes the visualization with a default shape, density, and brightness level.
*   **Rendering Loop (`animate()`):**
    *   A standard Three.js animation loop using `requestAnimationFrame`.
    *   Updates `OrbitControls` and renders the `Scene` with the `Camera` on each frame.

### 3. (Optional) CSS (`assets/css/platonic-solids/style.css`)

If a dedicated CSS file (`assets/css/platonic-solids/style.css`) is used, it would contain styles for the UI elements (sliders, buttons, labels) to ensure they are positioned correctly over the canvas and are visually appealing. Basic styling might also be handled inline within the blog post's HTML or via a global site stylesheet.

## How it Works (Overall Flow)

1.  **Loading:** The user navigates to the blog post. The browser loads the HTML structure defined in the Markdown file.
2.  **Script Execution:** The CDN scripts for Three.js, GSAP, and OrbitControls are loaded, followed by `main.js`.
3.  **Initialization (`main.js`):**
    *   Sets up the Three.js scene, camera, renderer, and attaches the renderer's DOM element (the canvas) to `#platonic-solids-canvas`.
    *   Initializes the particle system. The particles are initially positioned to form the first Platonic solid in the `platonicSolidsData` array.
    *   The UI controls (shape selector buttons, density/brightness sliders, recenter button) are created and/or their event listeners are attached.
    *   The initial color theme, density, and brightness are applied.
4.  **Interaction:**
    *   The user can interact with the visualization using mouse controls (pan, zoom, rotate via OrbitControls).
    *   **Shape Change:** Clicking a shape selector button updates `currentShapeIndex` and calls `startMorph()`. GSAP animates the particles: first exploding outwards into a spherical cloud, then coalescing into the new target shape.
    *   **Density Adjustment:** Moving the density slider updates the `opacity` of the `PointsMaterial`, making particles more or less transparent.
    *   **Brightness Adjustment:** Moving the brightness slider modifies the particle colors by multiplying them with the selected brightness factor and then re-applying the color theme.
    *   **Recenter:** Clicking the recenter button resets the camera to its default position and orientation.
5.  **Rendering:** The `animate()` function runs continuously, re-rendering the scene at the browser's refresh rate, creating the illusion of smooth animation and responsiveness. 