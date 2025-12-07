import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Player } from './Player.js';
import { Station } from './Station.js';
// Imports for LevelManager (factory usage)
import { Crate } from './Crate.js';
import { Ingredient, IngredientType } from './Ingredient.js';
import { ChoppingBoard } from './ChoppingBoard.js';
import { Stove } from './Stove.js';
import { PlateDispenser } from './PlateDispenser.js';
import { Counter } from './Counter.js';
import { DeliveryStation } from './DeliveryStation.js';

import { RemotePlayer } from './RemotePlayer.js';
import { OrderManager } from './OrderManager.js';
import { UIManager } from './UIManager.js';
import { LevelManager } from './LevelManager.js';
import { Editor } from './Editor.js';

export class GameWorld {
    constructor(container) {
        this.initThree(container);
        this.initPhysics();

        // Systems
        this.orderManager = new OrderManager();
        this.uiManager = new UIManager();
        this.levelManager = new LevelManager(this);
        this.editor = new Editor(this, this.levelManager);

        this.createObjects();
        this.handleResize();

        this.lastTime = 0;
        this.gameTime = 120.0; // 2 minutes
    }

    initThree(container) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue

        // Isometric Camera setup
        const aspect = window.innerWidth / window.innerHeight;
        const d = 10;
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

        // Isometric view position (Aligned to axis for consistency)
        this.camera.position.set(0, 50, 40);
        this.camera.lookAt(this.scene.position);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 5);
        dirLight.castShadow = true;
        dirLight.shadow.camera.left = -20;
        dirLight.shadow.camera.right = 20;
        dirLight.shadow.camera.top = 20;
        dirLight.shadow.camera.bottom = -20;
        this.scene.add(dirLight);
    }

    initPhysics() {
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -30, 0), // Strong gravity
        });

        // Materials
        const defaultMaterial = new CANNON.Material('default');
        const playerMaterial = new CANNON.Material('player');

        const contactMat = new CANNON.ContactMaterial(defaultMaterial, playerMaterial, {
            friction: 0.0,
            restitution: 0.0,
        });
        this.world.addContactMaterial(contactMat);

        // Share materials so entities can use the correct instances
        this.world.materials = {
            default: defaultMaterial,
            player: playerMaterial
        };
    }

    createObjects() {
        // Visual Floor
        const floorGeo = new THREE.PlaneGeometry(20, 20);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        this.floor = new THREE.Mesh(floorGeo, floorMat);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);

        // Physics Floor
        const floorBody = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Plane(),
            material: this.world.materials.default
        });
        floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(floorBody);

        this.stations = [];
        this.world.interactables = []; // Shared list for Player raycasting

        // Player
        this.player = new Player(this.scene, this.world, new CANNON.Vec3(0, 2, 0));
        this.remotePlayers = new Map();

        // Load Default Level via LevelManager (Aligned to 2x2 grid)
        const defaultLevel = {
            stations: [
                { type: 'counter', x: -4, z: -6, properties: {} },
                { type: 'counter', x: -4, z: -4, properties: {} },
                { type: 'counter', x: -4, z: -2, properties: {} },
                { type: 'chopping_board', x: -4, z: 0, properties: {} },
                { type: 'stove', x: -4, z: 2, properties: {} },
                { type: 'plate_dispenser', x: 4, z: -6, properties: {} },
                { type: 'crate_tomato', x: 4, z: -4, properties: {} },
                { type: 'crate_lettuce', x: 4, z: -2, properties: {} },
                { type: 'crate_meat', x: 4, z: 0, properties: {} },
                { type: 'delivery', x: 0, z: -8, properties: {} }
            ]
        };
        this.levelManager.loadLevel(defaultLevel);
    }

    update(time) {
        if (!this.lastTime) this.lastTime = time;
        // Calculate dt in seconds
        const rawDt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        // Cap dt to prevent explosion on tab switch (max 0.1s frame)
        const dt = Math.min(rawDt, 0.1);

        // Physics step: fixed time step 1/60, max substeps 3
        this.world.step(1 / 60, dt, 3);

        if (this.player) this.player.update(time);

        // Update remote players (smoothing)
        this.remotePlayers.forEach(rp => {
            if (rp.update) rp.update(dt);
        });

        // Update stations
        for (const station of this.stations) {
            if (station.update) station.update(dt);
        }

        // Systems
        this.orderManager.update(dt);

        // Update Game Timer
        if (this.gameTime > 0) {
            this.gameTime -= dt;
            if (this.gameTime < 0) this.gameTime = 0;
        }

        // Format Timer MM:SS
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        const timerString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        this.uiManager.update(this.orderManager.score, timerString, this.orderManager.orders);

        this.renderer.render(this.scene, this.camera);
    }

    handleResize() {
        window.addEventListener('resize', () => {
            const aspect = window.innerWidth / window.innerHeight;
            const d = 10;
            this.camera.left = -d * aspect;
            this.camera.right = d * aspect;
            this.camera.top = d;
            this.camera.bottom = -d;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // Update remote player position from server
    updateRemotePlayer(id, pdata) {
        let rp = this.remotePlayers.get(id);
        if (!rp) {
            rp = new RemotePlayer(this.scene, id);
            this.remotePlayers.set(id, rp);
        }
        if (pdata.position) {
            // Pass the full position object (contains x, y, z, heldItem)
            rp.setPosition(pdata.position);
        }
        if (pdata.colors) {
            rp.updateColors(pdata.colors);
        }
    }

    forceStationItem(station, type, ingredients) {
        // Create new item
        const item = new Ingredient(this.scene, type);

        // Attach to station
        station.heldItem = item;
        station.heldItem.mesh.position.copy(station.mesh.position);
        station.heldItem.mesh.position.y += 1.0;
        station.heldItem.isHeld = false;

        // Populate contents (if plate/pot)
        if (ingredients && station.heldItem.syncIngredients) {
            station.heldItem.syncIngredients(ingredients);
        }
    }
}
