import * as THREE from 'three';
import { scene, GAME_SIZE, TILE_SIZE, MAP_SIZE } from '../core/init.js';
import { getTerrainHeight } from '../core/init.js';
import { generatePathfindingGrid } from '../pathfinding/grid.js';
import { SimplexNoise } from './simplex.js';

export let resourceNodes = [];

// Generate terrain with varied heights and features
export function generateTerrain() {
    const terrainGeometry = new THREE.PlaneGeometry(GAME_SIZE, GAME_SIZE, MAP_SIZE - 1, MAP_SIZE - 1);
    terrainGeometry.rotateX(-Math.PI / 2); // Rotate to be flat on xz plane
    
    // Generate height map using simplex noise
    const vertices = terrainGeometry.attributes.position.array;
    const simplex = new SimplexNoise();
    
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        
        // Create natural-looking terrain with simplex noise
        const elevation = simplex.noise2D(x / 200, z / 200) * 15; // Base terrain
        const roughness = simplex.noise2D(x / 50, z / 50) * 2; // Small details
        
        // Keep center areas flatter for better gameplay
        const distanceFromCenter = Math.sqrt(x * x + z * z) / (GAME_SIZE / 2);
        const flattenFactor = Math.max(0, 1 - Math.pow(1 - distanceFromCenter, 2));
        
        vertices[i + 1] = elevation * flattenFactor + roughness;
    }
    
    terrainGeometry.computeVertexNormals();
    
    // Create terrain material with grass texture
    const terrainMaterial = new THREE.MeshStandardMaterial({
        color: 0x3b7d3b,
        flatShading: false,
        roughness: 0.8,
        metalness: 0.1
    });
    
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.receiveShadow = true;
    terrain.name = 'terrain';
    scene.add(terrain);
    
    // Create terrain boundaries
    const borderGeometry = new THREE.BoxGeometry(GAME_SIZE + 20, 40, GAME_SIZE + 20);
    const borderMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.y = -20;
    scene.add(border);
    
    // Generate terrain grid for pathfinding
    generatePathfindingGrid(terrainGeometry);
}

// Create resource nodes on the map
export function createResourceNodes() {
    // Create tiberium fields (primary resource)
    for (let i = 0; i < 8; i++) {
        let validPosition = false;
        let position;
        
        // Find valid position not too close to base
        while (!validPosition) {
            const x = (Math.random() - 0.5) * (GAME_SIZE - 100);
            const z = (Math.random() - 0.5) * (GAME_SIZE - 100);
            position = new THREE.Vector3(x, 0, z);
            
            // Check distance from player and enemy bases
            const distToPlayer = position.distanceTo(new THREE.Vector3(-GAME_SIZE/4, 0, -GAME_SIZE/4));
            const distToEnemy = position.distanceTo(new THREE.Vector3(GAME_SIZE/4, 0, GAME_SIZE/4));
            
            if (distToPlayer > 150 && distToEnemy > 150) {
                validPosition = true;
            }
        }
        
        // Adjust y position to terrain height
        position.y = getTerrainHeight(position.x, position.z);
        
        createResourceNode('tiberium', position, 5000);
    }
}

// Create individual resource node
export function createResourceNode(type, position, amount) {
    let nodeGeometry, nodeMaterial;
    
    if (type === 'tiberium') {
        nodeGeometry = new THREE.CylinderGeometry(10, 10, 15, 6);
        nodeMaterial = new THREE.MeshStandardMaterial({
            color: 0x3ef73e,
            emissive: 0x1a7f1a,
            roughness: 0.3,
            metalness: 0.8
        });
    }
    
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    node.position.copy(position);
    node.position.y += 7.5; // Half height
    node.castShadow = true;
    node.receiveShadow = true;
    node.userData = {
        type: 'resource',
        resourceType: type,
        amount: amount
    };
    
    scene.add(node);
    resourceNodes.push(node);
    
    // Add crystal clusters around the main node
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 10;
        const clusterPosition = new THREE.Vector3(
            position.x + Math.cos(angle) * distance,
            position.y,
            position.z + Math.sin(angle) * distance
        );
        
        const clusterGeometry = new THREE.ConeGeometry(1 + Math.random() * 2, 3 + Math.random() * 7, 5);
        const cluster = new THREE.Mesh(clusterGeometry, nodeMaterial);
        cluster.position.copy(clusterPosition);
        cluster.rotation.y = Math.random() * Math.PI * 2;
        cluster.rotation.x = (Math.random() - 0.5) * 0.5;
        cluster.castShadow = true;
        cluster.receiveShadow = true;
        scene.add(cluster);
    }
}