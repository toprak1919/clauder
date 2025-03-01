import * as THREE from 'three';
import { scene, GAME_SIZE, units, buildings, resourceNodes, camera } from '../core/init.js';

// Setup minimap renderer
export function setupMinimap() {
    const minimapContainer = document.getElementById('minimap');
    
    // Create new instances instead of reassigning
    const newMinimapScene = new THREE.Scene();
    newMinimapScene.background = new THREE.Color(0x000000);
    
    const newMinimapCamera = new THREE.OrthographicCamera(
        -GAME_SIZE / 2, GAME_SIZE / 2, 
        GAME_SIZE / 2, -GAME_SIZE / 2, 
        1, 1000
    );
    newMinimapCamera.position.set(0, 500, 0);
    newMinimapCamera.lookAt(0, 0, 0);
    
    const newMinimapRenderer = new THREE.WebGLRenderer({ antialias: false });
    newMinimapRenderer.setSize(minimapContainer.clientWidth, minimapContainer.clientHeight);
    minimapContainer.appendChild(newMinimapRenderer.domElement);
    
    // Update the global references in init.js
    window.minimapScene = newMinimapScene;
    window.minimapCamera = newMinimapCamera;
    window.minimapRenderer = newMinimapRenderer;
    
    // Create simplified terrain for minimap
    const minimapTerrainGeometry = new THREE.PlaneGeometry(GAME_SIZE, GAME_SIZE);
    minimapTerrainGeometry.rotateX(-Math.PI / 2);
    
    const minimapTerrainMaterial = new THREE.MeshBasicMaterial({ color: 0x225522 });
    const minimapTerrain = new THREE.Mesh(minimapTerrainGeometry, minimapTerrainMaterial);
    newMinimapScene.add(minimapTerrain);
}

// Render the minimap
export function renderMinimap() {
    // Access the minimap elements from the window object
    const currentMinimapScene = window.minimapScene;
    const currentMinimapRenderer = window.minimapRenderer;
    const currentMinimapCamera = window.minimapCamera;
    
    if (!currentMinimapScene || !currentMinimapRenderer || !currentMinimapCamera) {
        return; // Exit if not initialized
    }
    
    // Clear existing unit markers
    currentMinimapScene.children.forEach(child => {
        if (child.userData.type === 'minimapMarker') {
            currentMinimapScene.remove(child);
        }
    });
    
    // Add markers for player units (blue)
    units.player.forEach(unit => {
        createMinimapMarker(unit.position, 0x0000ff, 'player');
    });
    
    // Add markers for player buildings (cyan)
    buildings.player.forEach(building => {
        createMinimapMarker(building.position, 0x00ffff, 'player');
    });
    
    // Add markers for visible enemy units (red)
    units.enemy.forEach(unit => {
        if (unit.visible) {
            createMinimapMarker(unit.position, 0xff0000, 'enemy');
        }
    });
    
    // Add markers for visible enemy buildings (magenta)
    buildings.enemy.forEach(building => {
        if (building.visible) {
            createMinimapMarker(building.position, 0xff00ff, 'enemy');
        }
    });
    
    // Add markers for resource nodes (green)
    resourceNodes.forEach(node => {
        createMinimapMarker(node.position, 0x00ff00, 'resource');
    });
    
    // Add camera frustum marker
    const cameraPositionXZ = new THREE.Vector3(camera.position.x, 0, camera.position.z);
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    
    const viewMarkerGeometry = new THREE.ConeGeometry(20, 40, 3);
    viewMarkerGeometry.rotateX(Math.PI / 2);
    const viewMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const viewMarker = new THREE.Mesh(viewMarkerGeometry, viewMarkerMaterial);
    viewMarker.position.copy(cameraPositionXZ);
    viewMarker.lookAt(cameraPositionXZ.clone().add(cameraDirection));
    viewMarker.userData = { type: 'minimapMarker' };
    currentMinimapScene.add(viewMarker);
    
    // Render the minimap
    currentMinimapRenderer.render(currentMinimapScene, currentMinimapCamera);
}

// Create marker for minimap
export function createMinimapMarker(position, color, type) {
    const currentMinimapScene = window.minimapScene;
    if (!currentMinimapScene) return;
    
    const markerGeometry = new THREE.CircleGeometry(type === 'building' ? 10 : 5, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: color });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(position.x, 1, position.z);
    marker.rotation.x = -Math.PI / 2;
    marker.userData = { type: 'minimapMarker' };
    currentMinimapScene.add(marker);
}