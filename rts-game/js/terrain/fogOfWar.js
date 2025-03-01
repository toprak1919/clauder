import * as THREE from 'three';
import { scene, GAME_SIZE, MAP_SIZE, TILE_SIZE, units, buildings } from '../core/init.js';

// Initialize fog of war
export function initFogOfWar() {
    const fogGeometry = new THREE.PlaneGeometry(GAME_SIZE, GAME_SIZE, 1, 1);
    fogGeometry.rotateX(-Math.PI / 2);
    
    const fogMaterial = new THREE.ShaderMaterial({
        uniforms: {
            fogMap: { value: createFogTexture() },
            fogColor: { value: new THREE.Color(0x000000) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D fogMap;
            uniform vec3 fogColor;
            varying vec2 vUv;
            void main() {
                float fogValue = texture2D(fogMap, vUv).r;
                if (fogValue < 0.1) {
                    // Unexplored
                    gl_FragColor = vec4(fogColor, 1.0);
                } else if (fogValue < 1.0) {
                    // Explored but not visible
                    gl_FragColor = vec4(fogColor, 0.5);
                } else {
                    // Visible
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
                }
            }
        `,
        transparent: true,
        depthWrite: false
    });
    
    const fog = new THREE.Mesh(fogGeometry, fogMaterial);
    fog.position.y = 1; // Slightly above terrain
    fog.name = 'fogOfWar';
    scene.add(fog);
}

// Create fog of war texture based on visibility
export function createFogTexture() {
    const size = 512; // Texture size
    const data = new Uint8Array(size * size);
    const grid = window.fogOfWarGrid;
    
    if (!grid) return new THREE.DataTexture(data, size, size, THREE.RedFormat);
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const gridX = Math.floor((x / size) * MAP_SIZE);
            const gridY = Math.floor((y / size) * MAP_SIZE);
            
            const value = grid[gridY][gridX] * 127;
            data[y * size + x] = value;
        }
    }
    
    const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat);
    texture.needsUpdate = true;
    return texture;
}

// Update fog of war based on unit visibility
export function updateFogOfWar() {
    const grid = window.fogOfWarGrid;
    if (!grid) return;
    
    // Reset visibility (keep explored areas)
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            if (grid[y][x] === 2) {
                grid[y][x] = 1;
            }
        }
    }
    
    // Update visibility based on player units and buildings
    [...units.player, ...buildings.player].forEach(entity => {
        const gridX = Math.floor((entity.position.x + GAME_SIZE / 2) / TILE_SIZE);
        const gridY = Math.floor((entity.position.z + GAME_SIZE / 2) / TILE_SIZE);
        
        const visionRange = entity.userData.visionRange || 5;
        
        // Reveal area around unit/building
        for (let y = Math.max(0, gridY - visionRange); y < Math.min(MAP_SIZE, gridY + visionRange); y++) {
            for (let x = Math.max(0, gridX - visionRange); x < Math.min(MAP_SIZE, gridX + visionRange); x++) {
                const distance = Math.sqrt(Math.pow(x - gridX, 2) + Math.pow(y - gridY, 2));
                if (distance <= visionRange) {
                    grid[y][x] = 2; // Visible
                }
            }
        }
    });
    
    // Update fog texture
    const fogMesh = scene.getObjectByName('fogOfWar');
    if (fogMesh) {
        fogMesh.material.uniforms.fogMap.value = createFogTexture();
        fogMesh.material.uniforms.fogMap.value.needsUpdate = true;
    }
    
    // Hide/show enemy units based on fog of war
    units.enemy.forEach(unit => {
        const gridX = Math.floor((unit.position.x + GAME_SIZE / 2) / TILE_SIZE);
        const gridY = Math.floor((unit.position.z + GAME_SIZE / 2) / TILE_SIZE);
        
        if (gridX >= 0 && gridX < MAP_SIZE && gridY >= 0 && gridY < MAP_SIZE) {
            unit.visible = grid[gridY][gridX] === 2;
        }
    });
    
    buildings.enemy.forEach(building => {
        const gridX = Math.floor((building.position.x + GAME_SIZE / 2) / TILE_SIZE);
        const gridY = Math.floor((building.position.z + GAME_SIZE / 2) / TILE_SIZE);
        
        if (gridX >= 0 && gridX < MAP_SIZE && gridY >= 0 && gridY < MAP_SIZE) {
            building.visible = grid[gridY][gridX] === 2;
        }
    });
}