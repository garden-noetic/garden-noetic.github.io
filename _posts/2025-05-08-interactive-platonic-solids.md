---
layout: post
title:  "Interactive Platonic Solids in 3D"
date:   2025-05-08 19:00:00 -0000
categories: 3d visualization threejs javascript
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap');

/* Use Roboto Mono for overlay text and make background transparent */
#text-screen-1 {
  font-family: 'Roboto Mono', monospace !important;
  background-color: transparent !important;
}
</style>

This is an interactive 3D demonstration of Platonic Solids. Use the mouse to rotate the view. Controls are available to change the shape and color.

<!-- Container for the whole interactive component -->
<div id="platonic-solids-interactive-block" style="margin-top: 20px; margin-bottom: 20px;">

    <!-- Top Controls: Shape Selectors -->
    <div id="shape-selector-container" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 15px; padding: 8px; background-color: rgba(30,30,50,0.7); border-radius: 4px;">
        <!-- Shape buttons added by JS -->
    </div>

    <!-- Main Canvas Area -->
    <div id="platonic-solids-embed-container" style="position: relative; width: 100%; max-width: 700px; /* Restore width */ height: 500px; /* Restore height */ margin: 0 auto; /* Center */ border: 1px solid #555; background-color: #111; touch-action: none;">
        <!-- The canvas where Three.js will render -->
        <canvas id="webgl-canvas" style="display: block; width: 100%; height: 100%;"></canvas>
        <!-- Text Overlay Container -->
        <div id="text-overlay-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; display: flex; justify-content: center; align-items: flex-end; padding-bottom: 20px; z-index: 5;">
            <div id="text-screen-1" class="text-screen" style="color: #f0f0f0; padding: 10px 20px; max-width: 85%; text-align: center; font-family: 'Roboto Mono', monospace; font-size: 0.9em; opacity: 0; transition: opacity 1s ease-in-out; background-color: rgba(0,0,0,0.5); border-radius: 4px;">
                <!-- Text will be injected here by JS -->
            </div>
        </div>
        <!-- Next button for text navigation -->
        <button id="next-text-btn" style="position: absolute; bottom: 20px; left: 20px; z-index: 10; opacity: 0; pointer-events: none; background-color: rgba(255,255,255,0.8); color: #000; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; transition: opacity 0.5s ease-in-out;">Next Info</button>
        <!-- Morphing Info still overlays canvas -->
        <div id="morphing-info" style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); min-height: 1em; color: #0f0; z-index: 10; padding: 8px; background-color: rgba(0,0,0,0.6); border-radius: 4px; pointer-events: none;"></div>
    </div>

    <!-- Bottom Controls: Display Settings -->
    <div id="controls" style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 15px; margin-top: 15px; padding: 10px; background-color: rgba(20, 20, 40, 0.75); border-radius: 8px; box-shadow: 0 0 10px rgba(0, 120, 255, 0.4); border: 1px solid #335;">
        <!-- Color Palette -->
        <div class="color-palette" style="display: flex; gap: 8px;">
            <div class="color-swatch" data-color="gold" title="Gold" style="width: 25px; height: 25px; border-radius: 50%; cursor: pointer; border: 2px solid #555; background: linear-gradient(45deg, #FFD700, #FFA500);"></div>
            <div class="color-swatch" data-color="purple" title="Purple" style="width: 25px; height: 25px; border-radius: 50%; cursor: pointer; border: 2px solid #555; background: linear-gradient(45deg, #8A2BE2, #DA70D6);"></div>
            <div class="color-swatch" data-color="green" title="Green" style="width: 25px; height: 25px; border-radius: 50%; cursor: pointer; border: 2px solid #555; background: linear-gradient(45deg, #32CD32, #90EE90);"></div>
            <div class="color-swatch" data-color="rainbow" title="Rainbow" style="width: 25px; height: 25px; border-radius: 50%; cursor: pointer; border: 2px solid #555; background: linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet);"></div>
        </div>
        
        <!-- Separator -->
        <div style="border-left: 1px solid #555; height: 25px;"></div>

        <!-- Density Controls (Buttons) -->
        <div class="control-group" style="display: flex; align-items: center; gap: 5px;">
            <span style="color: white; font-size: 0.8em;">Density:</span>
            <button class="density-btn" data-density="low" title="Low Density" style="background-color: #555; color: white; border: 1px solid #888; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 0.8em;">L</button>
            <button class="density-btn" data-density="medium" title="Medium Density" style="background-color: #777; color: white; border: 1px solid #aaa; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 0.8em;">M</button> <!-- Default -->
            <button class="density-btn" data-density="high" title="High Density" style="background-color: #555; color: white; border: 1px solid #888; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 0.8em;">H</button>
        </div>

        <!-- Separator -->
        <div style="border-left: 1px solid #555; height: 25px;"></div>

        <!-- Brightness Controls (Buttons) -->
        <div class="control-group" style="display: flex; align-items: center; gap: 5px;">
             <span style="color: white; font-size: 0.8em;">Brightness:</span>
             <button class="brightness-btn" data-brightness="low" title="Low Brightness" style="background-color: #555; color: white; border: 1px solid #888; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 0.8em;">L</button>
             <button class="brightness-btn" data-brightness="medium" title="Medium Brightness" style="background-color: #777; color: white; border: 1px solid #aaa; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 0.8em;">M</button> <!-- Default -->
             <button class="brightness-btn" data-brightness="high" title="High Brightness" style="background-color: #555; color: white; border: 1px solid #888; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 0.8em;">H</button>
        </div>

        <!-- Separator -->
        <div style="border-left: 1px solid #555; height: 25px;"></div>

        <!-- Recenter Button -->
        <button id="recenter-btn" title="Recenter View" style="background-color: rgba(70,70,90,0.8); color: white; border: 1px solid #888; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 1.2em; line-height: 1;">&#x2316;</button>
    </div>

</div>

<!-- Rest of your blog post content -->
More text about the project and Platonic Solids...

<br />
<hr />

<!-- Scripts: Load libraries first, then your custom script. -->
<!-- Placed at the end to ensure HTML elements are loaded. -->

<!-- Three.js library (r128 as per consultant's example) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

<!-- GSAP library (3.9.1 as per consultant's example) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.9.1/gsap.min.js"></script>

<!-- OrbitControls for Three.js r128 -->
<script src="https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

<!-- Solid configuration and presentation data -->
<script src="{{ '/assets/js/platonic-solids/solid-data.js' | relative_url }}"></script>

<!-- Your custom Platonic Solids script -->
<script src="{{ '/assets/js/platonic-solids/main.js'      | relative_url }}"></script>

<!-- (Optional) Link to your custom CSS if you created one -->
<!-- <link rel="stylesheet" href="{{ '/assets/css/platonic-solids/style.css' | relative_url }}"> --> 