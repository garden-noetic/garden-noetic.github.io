// --- Essential references for embedded context ---
const embedContainer = document.getElementById('platonic-solids-embed-container');
const canvasElement = document.getElementById('webgl-canvas');

// --- Global Three.js Variables ---
let scene, camera, renderer, particles, backgroundStars;
let orbitControls;
let wireframeMesh; // To hold the wireframe overlay

// --- Particle System & Morphing Variables ---
// const PARTICLE_COUNT = 12000; // Replaced by MAX_PARTICLE_COUNT and density levels
const MAX_PARTICLE_COUNT = 25000; // Max particles buffers are allocated for
const BACKGROUND_STAR_COUNT = 1500;
const MORPH_DURATION = 2.5;
const EXPLODE_SCALE = 1.8;

// --- GLOBAL VARIABLES & ELEMENT REFS ---
// (DENSITY_LEVELS, BRIGHTNESS_LEVELS, shapes, colorThemes, and solidPresentations are imported from solid-data.js)
let currentDensityKey = 'low';  // Default to low density
let currentBrightnessKey = 'low';  // Default to low brightness
let currentParticleCount = DENSITY_LEVELS[currentDensityKey];

let positions, colors, targetPositions, explodePositions;
let currentShapeIndex = 0;
// shapes is imported from solid-data.js
let isMorphing = false;

// Text overlay variables
let textScreen1; // Reference to the welcome overlay element
let isTextOverlayActive = false; // Flag to track overlay state
let nextTextBtn; // Reference to the Next navigation button
let currentTextSegmentIndex = 0;
let currentSolidName = null;

// solidPresentations is imported from solid-data.js

// Camride state
let currentCameraTween = null;
let isCamrideActive     = false;

// Horizontal offset to shift solids to the right (scene units)
const SHAPE_X_OFFSET = 1.0;

// --- UTILITY FUNCTIONS ---
// Helper to update text screen content with fade
function updateTextScreen(segment) {
    if (!textScreen1) return;
    const html = `<strong>${segment.title}</strong><br><br>${segment.content}`;
    // Fade out then update & fade in
    textScreen1.style.opacity = '0';
    setTimeout(() => {
        textScreen1.innerHTML = html;
        textScreen1.style.opacity = '1';
    }, 1000); // match CSS transition duration
}

/**
 * Display a specific text segment (fades using TEXT_FADE_DURATION).
 */
function displayTextSegment(shapeName, idx) {
  const arr = solidPresentations[shapeName] || [];
  const seg = arr[idx];
  if (!seg) {
    if (textScreen1) textScreen1.style.opacity = 0;
    if (nextTextBtn)  nextTextBtn.style.opacity = 0;
    return;
  }
  // Fade-out then update & fade-in
  if (textScreen1) textScreen1.style.opacity = 0;
  setTimeout(() => {
    if (textScreen1) {
      textScreen1.innerHTML = `<strong>${seg.title}</strong><br><br>${seg.content}`;
      textScreen1.style.opacity = 1;
    }
  }, TEXT_FADE_DURATION);
  // Next button visibility
  if (nextTextBtn) {
    if (idx < arr.length - 1) {
      nextTextBtn.style.opacity = 1;
      nextTextBtn.style.pointerEvents = 'auto';
    } else {
      nextTextBtn.style.opacity = 0;
      nextTextBtn.style.pointerEvents = 'none';
    }
  }
}

/**
 * Animate camera to a new position/target with horizontal offset for the shape.
 */
function startCamrideSegment(params) {
    if (!camera || !orbitControls || !params || !params.position || !params.target) return;
    if (currentCameraTween) {
        currentCameraTween.kill();
    }
    isCamrideActive = true;
    // Target X is offset to the shape's actual position for correct pivoting
    const targetWorldX = params.target.x + SHAPE_X_OFFSET;
    const targetWorldY = params.target.y;
    const targetWorldZ = params.target.z;

    // Camera X position uses the direct value from params (relative to world origin for X)
    // This makes the offset shape appear on the right side of the view.
    const cameraWorldX = params.position.x;
    const cameraWorldY = params.position.y;
    const cameraWorldZ = params.position.z;

    currentCameraTween = gsap.timeline({
        onComplete: () => { isCamrideActive = false; }
    })
    .to(camera.position, {
        x: cameraWorldX,
        y: cameraWorldY,
        z: cameraWorldZ,
        duration: 1.5,
        ease: 'sine.inOut'
    }, 0)
    .to(orbitControls.target, {
        x: targetWorldX,
        y: targetWorldY,
        z: targetWorldZ,
        duration: 1.5,
        ease: 'sine.inOut',
        onUpdate: () => orbitControls.update()
    }, 0);
}

// --- UI Element References ---
// const morphingInfoDiv = document.getElementById('morphing-info'); // No longer used for text
const shapeSelectorContainer = document.getElementById('shape-selector-container'); // New container for shape buttons
// Slider and label references will be fetched in init()

// Color themes are imported from solid-data.js
let currentColorTheme = 'gold';

// --- APPLICATION INITIALIZATION & UI SETUP ---
function init() {
    if (!embedContainer || !canvasElement) {
        console.error("Platonic Solids Demo: Required HTML elements (embed container or canvas) are missing!");
        if (shapeSelectorContainer) shapeSelectorContainer.textContent = "Error: Canvas container not found.";
        return;
    }

    // Reference the welcome text overlay element
    textScreen1 = document.getElementById('text-screen-1');

    // Reference Next button for text navigation
    nextTextBtn = document.getElementById('next-text-btn');
    if (nextTextBtn) {
        nextTextBtn.addEventListener('click', () => {
            currentTextSegmentIndex++;
            displayTextSegment(currentSolidName, currentTextSegmentIndex);
            startCamrideSegment(solidPresentations[currentSolidName][currentTextSegmentIndex].camera);
        });
    }

    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera
    camera = new THREE.PerspectiveCamera(75, embedContainer.clientWidth / embedContainer.clientHeight, 0.1, 1000);
    camera.position.z = 3.0; // Slightly closer for smaller embed

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true });
    renderer.setSize(embedContainer.clientWidth, embedContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    // No need to appendChild, canvas is already in HTML.
    // Set clear color for the canvas (matches your embed container bg)
    renderer.setClearColor(0x111111, 1);


    // 4. OrbitControls
    if (typeof THREE.OrbitControls === 'function') {
        orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
        orbitControls.enableDamping = true;
        orbitControls.dampingFactor = 0.05;
        orbitControls.minDistance = 1;
        orbitControls.maxDistance = 15;
        orbitControls.enablePan = true;
        // orbitControls.target.set(0, 0, 0); // Ensure target is initially at origin
    } else {
        console.warn("OrbitControls not available. Mouse interaction will be limited.");
    }
    
    // 5. Particle System
    const geometry = new THREE.BufferGeometry();
    // Allocate buffers for MAX particles
    positions = new Float32Array(MAX_PARTICLE_COUNT * 3);
    colors = new Float32Array(MAX_PARTICLE_COUNT * 3);
    targetPositions = new Float32Array(MAX_PARTICLE_COUNT * 3);
    explodePositions = new Float32Array(MAX_PARTICLE_COUNT * 3);

    // Initial random positions (fill for MAX particles)
    for (let i = 0; i < MAX_PARTICLE_COUNT; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('initialPosition', new THREE.BufferAttribute(positions.slice(), 3));

    // Set initial draw range based on default density
    geometry.setDrawRange(0, currentParticleCount);

    const material = new THREE.PointsMaterial({
        size: 0.025, // Reset to a fixed medium size
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.85, 
        depthWrite: false,
        sizeAttenuation: true
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Create and add wireframe mesh initially
    const initialGeometry = generateShapePositions(shapes[currentShapeIndex], targetPositions);
    if (initialGeometry) {
        const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x666666, wireframe: true });
        wireframeMesh = new THREE.Mesh(initialGeometry, wireframeMaterial);
        wireframeMesh.visible = false; // Initially hide the wireframe
        scene.add(wireframeMesh);
    } else {
        console.error("Failed to generate initial geometry for wireframe.");
    }

    // 6. Background Stars
    createBackgroundStars();

    // Apply horizontal offset so the orbit pivot (camera target) aligns with shape center
    if (particles) particles.position.x = SHAPE_X_OFFSET;
    if (wireframeMesh) wireframeMesh.position.x = SHAPE_X_OFFSET;
    if (backgroundStars) backgroundStars.position.x = SHAPE_X_OFFSET;

    // Align the orbitControls pivot to the shape center immediately
    if (orbitControls) {
        orbitControls.target.set(SHAPE_X_OFFSET, 0, 0);
        orbitControls.update();
    }

    // 7. Initial shape, color, and UI updates
    applyColorTheme();
    generateShapePositions(shapes[currentShapeIndex], targetPositions);
    // Directly set initial positions to the first shape
    particles.geometry.attributes.position.array.set(targetPositions);
    particles.geometry.attributes.initialPosition.array.set(targetPositions);
    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.initialPosition.needsUpdate = true;


    // 8. Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    
    // Dynamically create Shape Selector Buttons
    if (shapeSelectorContainer) {
        shapes.forEach((shapeName, index) => {
            const button = document.createElement('button');
            button.textContent = shapeName;
            button.style.backgroundColor = '#007bff';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.padding = '5px 10px';
            button.style.borderRadius = '3px';
            button.style.cursor = 'pointer';
            button.style.fontSize = '0.8em';
            button.style.fontFamily = "'Courier New', Courier, monospace";
            button.addEventListener('click', () => {
                if (isMorphing) return;
                // Stop any ongoing camride
                if (currentCameraTween) {
                    currentCameraTween.kill();
                    isCamrideActive = false;
                }
                // Prepare new shape
                currentShapeIndex = index;
                currentSolidName = shapes[index];
                currentTextSegmentIndex = 0;
                // Randomize particle color theme
                const themeKeys = Object.keys(colorThemes);
                currentColorTheme = themeKeys[Math.floor(Math.random() * themeKeys.length)];
                applyColorTheme();
                // Hide text/next until segment & camera appear
                if (textScreen1) textScreen1.style.opacity = 0;
                if (nextTextBtn)  nextTextBtn.style.opacity = 0; nextTextBtn.style.pointerEvents = 'none';
                // Trigger morph
                startMorph();
                // Immediately show first text & camera
                displayTextSegment(currentSolidName, 0);
                startCamrideSegment(solidPresentations[currentSolidName][0].camera);
            });
            shapeSelectorContainer.appendChild(button);
        });
    } else {
        console.warn("Shape selector container not found.");
    }


    const colorSwatches = document.querySelectorAll('.color-swatch');
    if (colorSwatches.length > 0) {
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                currentColorTheme = swatch.dataset.color;
                applyColorTheme(); // Will now apply brightness
            });
        });
    } else {
        console.warn("Color swatches not found.");
    }

    // New UI Control Event Listeners for Buttons (replacing sliders)
    const densityBtns = document.querySelectorAll('.density-btn');
    const brightnessBtns = document.querySelectorAll('.brightness-btn');

    const updateButtonStyles = (buttons, activeKey, dataAttribute) => {
        buttons.forEach(btn => {
            if (btn.dataset[dataAttribute] === activeKey) {
                btn.style.backgroundColor = '#777'; // Active style
                btn.style.borderColor = '#aaa';
            } else {
                btn.style.backgroundColor = '#555'; // Inactive style
                btn.style.borderColor = '#888';
            }
        });
    };

    if (densityBtns.length > 0) {
        densityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                currentDensityKey = btn.dataset.density;
                currentParticleCount = DENSITY_LEVELS[currentDensityKey];
                particles.geometry.setDrawRange(0, currentParticleCount);
                updateButtonStyles(densityBtns, currentDensityKey, 'density');
            });
        });
        updateButtonStyles(densityBtns, currentDensityKey, 'density'); // Set initial style
    } else {
        console.warn("Density buttons not found.");
    }

    if (brightnessBtns.length > 0) {
        brightnessBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                currentBrightnessKey = btn.dataset.brightness;
                applyColorTheme(); // Re-apply colors with new brightness
                updateButtonStyles(brightnessBtns, currentBrightnessKey, 'brightness');
            });
        });
        updateButtonStyles(brightnessBtns, currentBrightnessKey, 'brightness'); // Set initial style
    } else {
        console.warn("Brightness buttons not found.");
    }

    const recenterButton = document.getElementById('recenter-btn');
    if (recenterButton) {
        recenterButton.addEventListener('click', () => {
            if (orbitControls) {
                orbitControls.reset();
                // camera.position.z = 3.0; // Could also explicitly reset camera position if reset() isn't enough
                // orbitControls.target.set(0,0,0); // orbitControls.reset() should do this
                // orbitControls.update(); // Important after manual changes, reset() might do it internally
            }
        });
    } else {
        console.warn("Recenter button not found.");
    }

    // After OrbitControls setup:
    if (orbitControls) {
        orbitControls.addEventListener('start', () => {
            if (isCamrideActive && currentCameraTween) {
                currentCameraTween.kill();
                isCamrideActive = false;
            }
        });
    }

    // 9. Start Animation
    animate();
}

// --- THREE.JS SCENE & PARTICLE SYSTEM FUNCTIONS ---
function createBackgroundStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(BACKGROUND_STAR_COUNT * 3);
    const starScale = 100; // Increased scale for a larger enclosing sphere

    for (let i = 0; i < BACKGROUND_STAR_COUNT; i++) {
        // Generate a random point in a cube
        let x = (Math.random() - 0.5) * 2; // Range -1 to 1
        let y = (Math.random() - 0.5) * 2; // Range -1 to 1
        let z = (Math.random() - 0.5) * 2; // Range -1 to 1

        // Normalize to a sphere and scale
        const length = Math.sqrt(x*x + y*y + z*z);
        // Avoid division by zero if Math.random() somehow yields (0,0,0) for x,y,z simultaneously
        if (length === 0) {
            x = starScale; // Default to a point on the sphere if degenerate
            y = 0;
            z = 0;
        } else {
            x = (x / length) * starScale;
            y = (y / length) * starScale;
            z = (z / length) * starScale;
        }

        starPositions[i * 3 + 0] = x;
        starPositions[i * 3 + 1] = y;
        starPositions[i * 3 + 2] = z;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
        size: 0.25, // Adjusted size (was 0.07) to compensate for increased starScale and sizeAttenuation
        color: 0xaaaaaa,
        transparent: true,
        opacity: 0.4,
        sizeAttenuation: true,
        depthWrite: false
    });
    backgroundStars = new THREE.Points(starGeometry, starMaterial);
    scene.add(backgroundStars);
}

function getRandomPointInTriangle(vA, vB, vC) {
    let r1 = Math.random();
    let r2 = Math.random();
    const s1 = Math.sqrt(r1);
    const u = 1 - s1;
    const v = s1 * (1 - r2);
    const w = s1 * r2;
    return new THREE.Vector3(
        u * vA.x + v * vB.x + w * vC.x,
        u * vA.y + v * vB.y + w * vC.y,
        u * vA.z + v * vB.z + w * vC.z
    );
}

function generateShapePositions(shapeName, targetArray) {
    const S = 1.2; // Adjusted general size factor for embed
    let geometry;
    let useGeometrySampling = true; // Flag to use default sampling

    switch (shapeName) {
        case 'Tetrahedron': geometry = new THREE.TetrahedronGeometry(S, 0); break;
        case 'Cube': geometry = new THREE.BoxGeometry(S, S, S); break;
        case 'Octahedron': geometry = new THREE.OctahedronGeometry(S, 0); break;
        case 'Dodecahedron': geometry = new THREE.DodecahedronGeometry(S, 0); break;
        case 'Icosahedron': geometry = new THREE.IcosahedronGeometry(S, 0); break;
        case 'Sphere':
            geometry = new THREE.SphereGeometry(S, 16, 8); // Create geometry for wireframe too
            useGeometrySampling = false;
            for (let i = 0; i < MAX_PARTICLE_COUNT; i++) {
                const idx = i * 3;
                const phi = Math.acos(-1 + (2 * Math.random())); 
                const theta = Math.random() * 2 * Math.PI;
                targetArray[idx + 0] = S * Math.sin(phi) * Math.cos(theta);
                targetArray[idx + 1] = S * Math.sin(phi) * Math.sin(theta);
                targetArray[idx + 2] = S * Math.cos(phi);
            }
            break;
        default:
            console.error("Unknown shape:", shapeName);
            geometry = new THREE.SphereGeometry(S, 16, 8); // Fallback geometry
            useGeometrySampling = false;
             for (let i = 0; i < MAX_PARTICLE_COUNT; i++) {
                const idx = i * 3;
                const phi = Math.acos(-1 + (2 * Math.random()));
                const theta = Math.random() * 2 * Math.PI;
                targetArray[idx + 0] = S * Math.sin(phi) * Math.cos(theta);
                targetArray[idx + 1] = S * Math.sin(phi) * Math.sin(theta);
                targetArray[idx + 2] = S * Math.cos(phi);
            }
            // return null; // Don't return early, return the fallback geometry
    }

    // If we need to sample from geometry triangles (Platonic solids)
    if (useGeometrySampling) {
        if (!geometry) {
             console.error("Geometry generation failed for:", shapeName);
             return null; // Return null if geometry failed
        }
        const baseVertices = geometry.attributes.position.array;
        const indices = geometry.index ? geometry.index.array : null;
        const triangles = [];

        if (indices) {
            for (let i = 0; i < indices.length; i += 3) {
                const iA = indices[i], iB = indices[i+1], iC = indices[i+2];
                triangles.push([
                    new THREE.Vector3(baseVertices[iA*3], baseVertices[iA*3+1], baseVertices[iA*3+2]),
                    new THREE.Vector3(baseVertices[iB*3], baseVertices[iB*3+1], baseVertices[iB*3+2]),
                    new THREE.Vector3(baseVertices[iC*3], baseVertices[iC*3+1], baseVertices[iC*3+2])
                ]);
            }
        } else {
            for (let i = 0; i < baseVertices.length; i += 9) {
                triangles.push([
                    new THREE.Vector3(baseVertices[i], baseVertices[i+1], baseVertices[i+2]),
                    new THREE.Vector3(baseVertices[i+3], baseVertices[i+4], baseVertices[i+5]),
                    new THREE.Vector3(baseVertices[i+6], baseVertices[i+7], baseVertices[i+8])
                ]);
            }
        }
        
        if (triangles.length === 0) {
            console.error("No triangles found for shape:", shapeName, "using fallback sphere distribution.");
            // Fallback to sphere distribution
            for (let i = 0; i < MAX_PARTICLE_COUNT; i++) {
                const idx = i * 3;
                const phi = Math.acos(-1 + (2 * Math.random())); // Better random sphere
                const theta = Math.random() * 2 * Math.PI;
                targetArray[idx + 0] = S * Math.sin(phi) * Math.cos(theta);
                targetArray[idx + 1] = S * Math.sin(phi) * Math.sin(theta);
                targetArray[idx + 2] = S * Math.cos(phi);
            }
            if (geometry.dispose) geometry.dispose();
            return;
        }

        for (let i = 0; i < MAX_PARTICLE_COUNT; i++) {
            const particleIndex = i * 3;
            const randomTriangleIndex = Math.floor(Math.random() * triangles.length);
            const [vA, vB, vC] = triangles[randomTriangleIndex];
            const point = getRandomPointInTriangle(vA, vB, vC);
            targetArray[particleIndex + 0] = point.x;
            targetArray[particleIndex + 1] = point.y;
            targetArray[particleIndex + 2] = point.z;
        }
        // Don't dispose geometry here, we need to return it
        // if (geometry.dispose) geometry.dispose(); 
    }
    // Return the created geometry for the wireframe
    return geometry; 
}

function generateSphereExplodePositions(targetArray, radius) {
    for (let i = 0; i < MAX_PARTICLE_COUNT; i++) {
        const idx = i * 3;
        const phi = Math.acos(-1 + (2 * Math.random()));
        const theta = Math.random() * 2 * Math.PI;
        targetArray[idx + 0] = radius * Math.sin(phi) * Math.cos(theta);
        targetArray[idx + 1] = radius * Math.sin(phi) * Math.sin(theta);
        targetArray[idx + 2] = radius * Math.cos(phi);
    }
}

// --- MORPHING LOGIC ---
function startMorph() {
    if (isMorphing) return;
    isMorphing = true;
    if (wireframeMesh) wireframeMesh.visible = false; // Hide wireframe at start of morph

    const initialPosAttr = particles.geometry.attributes.initialPosition;
    const currentPosAttr = particles.geometry.attributes.position;
    initialPosAttr.array.set(currentPosAttr.array);
    initialPosAttr.needsUpdate = true;

    // Generate positions AND get the new geometry for the wireframe
    const newGeometry = generateShapePositions(shapes[currentShapeIndex], targetPositions);
    
    // Update wireframe geometry if successful
    if (wireframeMesh && newGeometry) {
        if (wireframeMesh.geometry) {
            wireframeMesh.geometry.dispose(); // Dispose old geometry
        }
        wireframeMesh.geometry = newGeometry;
    } else if (!newGeometry) {
         console.error("Failed to generate new geometry for wireframe update.");
    }
    
    // Generate positions for the intermediate EXPLODED state
    generateSphereExplodePositions(explodePositions, EXPLODE_SCALE); 

    // GSAP Timeline for two-stage morph
    const tl = gsap.timeline({
        onComplete: () => {
            isMorphing = false;
            currentPosAttr.array.set(targetPositions);
            currentPosAttr.needsUpdate = true;
            initialPosAttr.array.set(targetPositions);
            initialPosAttr.needsUpdate = true;
            if (wireframeMesh) wireframeMesh.visible = true; // Show wireframe when morph completes
        }
    });

    // Stage 1: Morph from current to exploded state
    tl.to({ progress: 0 }, {
        duration: MORPH_DURATION / 2,
        progress: 1,
        ease: "circ.out",
        onUpdate: function() {
            const progress = this.targets()[0].progress;
            const posArr = currentPosAttr.array;
            const initArr = initialPosAttr.array; // Current shape
            // Loop through MAX_PARTICLE_COUNT * 3 for buffer updates
            for (let i = 0; i < MAX_PARTICLE_COUNT * 3; i++) {
                posArr[i] = initArr[i] + (explodePositions[i] - initArr[i]) * progress;
            }
            currentPosAttr.needsUpdate = true;
        }
    })
    // At start of contraction phase, show first text segment
    .add(() => {
        // Display first text segment for the current solid
        const presentation = solidPresentations[shapes[currentShapeIndex]] || [];
        if (presentation.length > 0) {
            currentTextSegmentIndex = 0;
            const segment = presentation[0];
            if (textScreen1) {
                textScreen1.innerHTML = `<strong>${segment.title}</strong><br><br>${segment.content}`;
                textScreen1.style.opacity = '1';
            }
            if (nextTextBtn) {
                if (presentation.length > 1) {
                    nextTextBtn.style.opacity = '1';
                    nextTextBtn.style.pointerEvents = 'auto';
                } else {
                    nextTextBtn.style.opacity = '0';
                    nextTextBtn.style.pointerEvents = 'none';
                }
            }
        }
    })
    // Stage 2: Morph from exploded state to new target shape
    .to({ progress: 0 }, {
        duration: MORPH_DURATION / 2,
        progress: 1,
        ease: "circ.in",
        onUpdate: function() {
            const progress = this.targets()[0].progress;
            const posArr = currentPosAttr.array;
            // For this stage, 'initial' is the exploded state
            // Loop through MAX_PARTICLE_COUNT * 3 for buffer updates
            for (let i = 0; i < MAX_PARTICLE_COUNT * 3; i++) {
                posArr[i] = explodePositions[i] + (targetPositions[i] - explodePositions[i]) * progress;
            }
            currentPosAttr.needsUpdate = true;
        }
    });
}

function applyColorTheme() {
    if (!particles) return;
    const colorAttr = particles.geometry.attributes.color;
    const selectedTheme = colorThemes[currentColorTheme];
    const brightnessMultiplier = BRIGHTNESS_LEVELS[currentBrightnessKey];
    // Loop through MAX_PARTICLE_COUNT
    for (let i = 0; i < MAX_PARTICLE_COUNT; i++) {
        const baseColor = (typeof selectedTheme === 'function' && currentColorTheme === 'rainbow')
            ? selectedTheme(i, MAX_PARTICLE_COUNT) // Pass MAX here for consistency
            : selectedTheme();
        
        // Apply brightness multiplier and clamp
        colorAttr.array[i * 3 + 0] = Math.max(0, Math.min(1, baseColor.r * brightnessMultiplier));
        colorAttr.array[i * 3 + 1] = Math.max(0, Math.min(1, baseColor.g * brightnessMultiplier));
        colorAttr.array[i * 3 + 2] = Math.max(0, Math.min(1, baseColor.b * brightnessMultiplier));
    }
    colorAttr.needsUpdate = true;
}

// --- ANIMATION & RESIZE HANDLERS ---
function animate() {
    requestAnimationFrame(animate);
    if (orbitControls) orbitControls.update();

    if (particles && !isMorphing ) { 
        const rotationY = 0.001;
        particles.rotation.y += rotationY;
        if (wireframeMesh) { // Rotate wireframe with particles
             wireframeMesh.rotation.y += rotationY;
        }
    }
    if (backgroundStars) {
        backgroundStars.rotation.y += 0.00005; // Slower background rotation
    }
    if (renderer && scene && camera) renderer.render(scene, camera);
}

function onWindowResize() {
    if (!embedContainer || !renderer || !camera) return;
    camera.aspect = embedContainer.clientWidth / embedContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(embedContainer.clientWidth, embedContainer.clientHeight);
}

// --- Start the demo ---
// Wait for the DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init(); // DOMContentLoaded has already fired
}