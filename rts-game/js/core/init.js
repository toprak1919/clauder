import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { animate } from './engine.js';
import { generateTerrain } from '../terrain/generator.js';
import { createResourceNodes } from '../terrain/generator.js';
import { initFogOfWar } from '../terrain/fogOfWar.js';
import { createInitialBase } from '../buildings/building.js';
import { initializeAI } from '../ai/ai.js';
import { setupMinimap } from '../ui/minimap.js';
import { setupEventListeners } from '../input/mouse.js';

// Game constants
export const GAME_SIZE = 1000; // Size of the game world
export const TILE_SIZE = 20; // Size of each terrain tile
export const FOG_OF_WAR = true; // Enable fog of war
export const MAP_SIZE = GAME_SIZE / TILE_SIZE; // Map grid size

// Game state
export let scene, camera, renderer, controls;
export let terrain = [];
export let units = { player: [], enemy: [] };
export let buildings = { player: [], enemy: [] };
export let selectedUnits = [];
export let hoveredObject = null;
export let buildMode = { active: false, building: null };
export let resourceNodes = [];
let pathfindingGrid = [];
export let fogOfWarGrid = [];
let minimapRenderer, minimapScene, minimapCamera;
export let unitGroups = {};

// Initialize the game
export function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Create camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(200, 200, 200);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 300, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.camera.bottom = -500;
    directionalLight.shadow.camera.far = 1000;
    scene.add(directionalLight);
    
    // Setup orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.5;
    controls.maxPolarAngle = Math.PI / 2.5; // Limit to maintain top-down isometric view
    controls.minDistance = 50;
    controls.maxDistance = 500;
    
    // Setup minimap
    setupMinimap();
    
    // Generate terrain
    generateTerrain();
    
    // Create resource nodes
    createResourceNodes();
    
    // Initialize fog of war
    initFogOfWar();
    
    // Initialize player base
    createInitialBase('player', new THREE.Vector3(-GAME_SIZE/4, 0, -GAME_SIZE/4));
    
    // Initialize enemy base
    createInitialBase('enemy', new THREE.Vector3(GAME_SIZE/4, 0, GAME_SIZE/4));
    
    // Initialize AI
    initializeAI();
    
    // Add event listeners
    setupEventListeners();
    
    // Start animation loop
    animate();
}

// Handle window resize
export function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Get height of terrain at a specific world position
export function getTerrainHeight(x, z) {
    // Raycasting to find terrain height
    const raycaster = new THREE.Raycaster();
    raycaster.set(
        new THREE.Vector3(x, 100, z), // Start above the terrain
        new THREE.Vector3(0, -1, 0) // Cast downwards
    );
    
    const terrain = scene.getObjectByName('terrain');
    const intersects = raycaster.intersectObject(terrain);
    
    if (intersects.length > 0) {
        return intersects[0].point.y;
    }
    
    return 0; // Default height if no intersection
}