const {TextToSpeechClient} = require('@google-cloud/text-to-speech');
const fs = require('fs-extra');
const path = require('path');
const vm = require('vm');

// --- Configuration ---
// IMPORTANT: Path to your Google Cloud service account JSON key file
const keyFilePath = 'C:/Users/yurig/CascadeProjects/garden-noetic-blog/assets/js/platonic-solids/credentials/platonic-solids-459303-45af97d630d3.json';

// Output directory for generated audio files
const audioOutputDir = path.resolve(__dirname, '../assets/audio/platonic-solids');

// Path to the source of truth for text content
const solidDataPath = path.resolve(__dirname, '../assets/js/platonic-solids/solid-data.js');

// Voice assignments for each solid
const voiceAssignments = {
    "Tetrahedron": { languageCode: 'en-AU', name: 'en-AU-Neural2-C', ssmlGender: 'MALE' }, // Example, Neural2 voices are often good
    "Cube":        { languageCode: 'en-GB', name: 'en-GB-Neural2-D', ssmlGender: 'MALE' },
    "Octahedron":  { languageCode: 'en-GB', name: 'en-GB-Neural2-A', ssmlGender: 'FEMALE' },
    "Dodecahedron":{ languageCode: 'en-US', name: 'en-US-Neural2-J', ssmlGender: 'FEMALE' },
    "Icosahedron": { languageCode: 'en-IN', name: 'en-IN-Neural2-B', ssmlGender: 'MALE' },
    "Sphere":      { languageCode: 'en-US', name: 'en-US-Neural2-G', ssmlGender: 'FEMALE' }
    // Note: The 'Chirp3-HD' voices are newer and high-quality, but might be premium.
    // Using Neural2 as a robust alternative. You can adjust these as per your preference and available voices.
    // For example, using the ones you listed:
    // "Tetrahedron": { languageCode: 'en-AU', name: 'en-AU-Chirp3-HD-Achernar' },
    // "Cube":        { languageCode: 'en-GB', name: 'en-GB-Chirp3-HD-Iapetus' },
    // "Octahedron":  { languageCode: 'en-GB', name: 'en-GB-Chirp3-HD-Zubenelgenubi' },
    // "Dodecahedron":{ languageCode: 'en-US', name: 'en-US-Chirp3-HD-Algenib' },
    // "Icosahedron": { languageCode: 'en-IN', name: 'en-IN-Chirp3-HD-Algenib' },
    // "Sphere":      { languageCode: 'en-IN', name: 'en-IN-Chirp3-HD-Callirrhoe' }
};

const speakingRate = 0.95; // Adjust as needed

// --- Helper Functions ---

/**
 * Loads solidPresentations and shapes from solid-data.js
 */
async function loadSolidData() {
    try {
        const solidDataCode = await fs.readFile(solidDataPath, 'utf8');
        
        // Prepare a context for vm.runInContext
        const context = {
            THREE: { Vector3: function(x, y, z) { return { x: x, y: y, z: z }; } },
            console: console
        };
        vm.createContext(context);

        // Append exports so const declarations are assigned to context properties
        const wrappedCode = `"use strict";
${solidDataCode}
this._solidPresentations = solidPresentations;
this._shapes = shapes;`;

        const script = new vm.Script(wrappedCode, { filename: solidDataPath });
        script.runInContext(context);

        if (!context._solidPresentations || !context._shapes) {
            throw new Error('solidPresentations or shapes not found in solid-data.js context.');
        }
        
        return {
            solidPresentations: context._solidPresentations,
            shapes: context._shapes
        };

    } catch (error) {
        console.error(`Error loading solid data from ${solidDataPath}:`, error);
        throw error;
    }
}

/**
 * Synthesizes speech from text and saves it to a file.
 */
async function synthesizeAndSave(client, text, voiceConfig, filePath) {
    const request = {
        input: { text: text },
        voice: {
            languageCode: voiceConfig.languageCode,
            name: voiceConfig.name,
            // ssmlGender: voiceConfig.ssmlGender // Optional, but can help refine voice
        },
        audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: speakingRate,
        },
    };

    try {
        console.log(`Requesting TTS for: "${text.substring(0, 50)}..." with voice ${voiceConfig.name}`);
        const [response] = await client.synthesizeSpeech(request);
        await fs.writeFile(filePath, response.audioContent, 'binary');
        console.log(`Audio content written to file: ${filePath}`);
    } catch (error) {
        console.error(`Error synthesizing speech for "${text.substring(0,50)}...":`, error);
        // Decide if you want to continue with other files or stop
    }
}

// --- Main Execution ---
async function main() {
    // 1. Initialize Google Cloud TextToSpeech Client
    let client;
    try {
        client = new TextToSpeechClient({ keyFilename: keyFilePath });
    } catch (error) {
        console.error("Failed to initialize TextToSpeechClient. Is the keyFilePath correct and accessible?", error);
        console.error(`Key file path used: ${path.resolve(keyFilePath)}`);
        console.error("Ensure the GOOGLE_APPLICATION_CREDENTIALS environment variable is not set if you intend to use keyFilename, or that it points to a valid key if you are relying on it.");
        return; // Stop execution
    }
    

    // 2. Load presentation data
    let solidData;
    try {
        solidData = await loadSolidData();
    } catch (error) {
        console.error("Failed to load solid data. Halting script.");
        return;
    }
    const { solidPresentations, shapes } = solidData;

    // 3. Ensure output directory exists
    try {
        await fs.ensureDir(audioOutputDir);
        console.log(`Audio output directory ensured: ${audioOutputDir}`);
    } catch (error) {
        console.error(`Failed to create or access audio output directory ${audioOutputDir}:`, error);
        return; // Stop execution
    }

    // 4. Iterate and generate audio
    console.log("\nStarting audio generation process...");

    for (const shapeName of shapes) {
        const presentationSegments = solidPresentations[shapeName];
        const voiceConfig = voiceAssignments[shapeName];

        if (!presentationSegments) {
            console.warn(`No presentation segments found for shape: ${shapeName}. Skipping.`);
            continue;
        }
        if (!voiceConfig) {
            console.warn(`No voice assignment found for shape: ${shapeName}. Skipping.`);
            continue;
        }

        console.log(`\nProcessing shape: ${shapeName} with voice ${voiceConfig.name}`);

        for (let i = 0; i < presentationSegments.length; i++) {
            const segment = presentationSegments[i];
            // IMPORTANT: We are expecting 'content' field based on refined plan.
            // The original solid-data.js had 'sentences' array.
            // This script assumes solid-data.js will be updated to the new structure.
            // If running this script BEFORE updating solid-data.js, this part needs adjustment or solid-data.js needs pre-transformation.
            
            // For now, let's construct text assuming the NEW structure (title + content string)
            // This means solid-data.js needs to be updated first, or this script needs to handle old structure.
            // To make this script work before data change, we would do:
            // const textToSynthesize = segment.title + ". " + (Array.isArray(segment.sentences) ? segment.sentences.join(" ") : segment.content);
            // But sticking to the plan, 'content' will be the field.
            if (!segment.title || !segment.content) { // Check if using sentences array for now
                 if(segment.sentences && Array.isArray(segment.sentences)) {
                    segment.content = segment.sentences.join(" "); // Temporary fix if data not yet transformed
                 } else {
                    console.warn(`Segment ${i} for ${shapeName} is missing title or content. Skipping.`);
                    continue;
                 }
            }


            const textToSynthesize = segment.title + ". " + segment.content;
            const audioFileName = `${shapeName.toLowerCase().replace(/\s+/g, '_')}_segment_${i}.mp3`;
            const audioFilePath = path.join(audioOutputDir, audioFileName);

            // Optional: Skip if file exists (add --force later if needed)
            // if (await fs.pathExists(audioFilePath)) {
            //     console.log(`Audio file already exists: ${audioFilePath}. Skipping.`);
            //     continue;
            // }

            await synthesizeAndSave(client, textToSynthesize, voiceConfig, audioFilePath);
        }
    }

    console.log("\nAudio generation process completed.");
}

main().catch(error => {
    console.error("An unexpected error occurred during script execution:", error);
}); 