import * as THREE from 'three';

export class Editor {
    constructor(gameWorld, levelManager) {
        this.gameWorld = gameWorld;
        this.levelManager = levelManager;
        this.enabled = false;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Ghost object for placement preview
        this.ghostMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1, 1.5),
            new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 })
        );
        this.gameWorld.scene.add(this.ghostMesh);
        this.ghostMesh.visible = false;

        this.selectedType = 'counter';

        // Cache UI
        this.uiPanel = document.getElementById('editor-panel');
        this.uiSelected = document.getElementById('editor-selected');

        this.initInput();
    }

    initInput() {
        window.addEventListener('keydown', (e) => this.handleKey(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        // Block context menu
        window.addEventListener('contextmenu', (e) => {
            if (this.enabled) e.preventDefault();
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        this.ghostMesh.visible = this.enabled;

        if (this.uiPanel) {
            this.uiPanel.style.display = this.enabled ? 'block' : 'none';
        }

        console.log(`Editor ${this.enabled ? 'Enabled' : 'Disabled'}`);
    }

    setSelection(type) {
        this.selectedType = type;
        if (this.uiSelected) {
            this.uiSelected.innerText = type.replace('_', ' ').toUpperCase();
        }
    }

    handleKey(e) {
        if (e.code === 'Tab') {
            e.preventDefault();
            this.toggle();
        }

        if (!this.enabled) return;

        switch (e.key) {
            case '1': this.setSelection('counter'); break;
            case '2': this.setSelection('chopping_board'); break;
            case '3': this.setSelection('stove'); break;
            case '4': this.setSelection('plate_dispenser'); break;
            case '5': this.setSelection('crate_tomato'); break;
            case '6': this.setSelection('crate_lettuce'); break;
            case '7': this.setSelection('crate_meat'); break;
            case '8': this.setSelection('delivery'); break;
            case 'p':
                console.log(JSON.stringify(this.levelManager.serializeLevel(), null, 2));
                alert("Level saved to Console!");
                break;
        }
    }

    handleMouseMove(e) {
        if (!this.enabled) return;

        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.gameWorld.camera);

        // Raycast against the floor plane
        const intersects = this.raycaster.intersectObject(this.gameWorld.floor);

        if (intersects.length > 0) {
            const hit = intersects[0].point;
            // Snap to grid (assuming 2x2 grid roughly matches object size)
            const snapX = Math.round(hit.x / 2) * 2;
            const snapZ = Math.round(hit.z / 2) * 2;

            this.ghostMesh.position.set(snapX, 0.5, snapZ);
        }
    }

    handleMouseDown(e) {
        if (!this.enabled) return;

        // Left Click: Place
        if (e.button === 0) {
            // Check if spot is occupied
            const x = this.ghostMesh.position.x;
            const z = this.ghostMesh.position.z;

            // Allow stacking? No.
            // Simple check: iterate users stations
            // Optimization: Spatial hash map, but for now linear scan is fine
            const occupied = this.gameWorld.stations.find(s =>
                Math.abs(s.mesh.position.x - x) < 0.1 &&
                Math.abs(s.mesh.position.z - z) < 0.1
            );

            if (!occupied) {
                this.levelManager.spawnStation(this.selectedType, x, z);
            }
        }

        // Right Click: Remove
        if (e.button === 2) {
            const x = this.ghostMesh.position.x;
            const z = this.ghostMesh.position.z;

            const existing = this.gameWorld.stations.find(s =>
                Math.abs(s.mesh.position.x - x) < 0.1 &&
                Math.abs(s.mesh.position.z - z) < 0.1
            );

            if (existing) {
                // Remove visuals
                this.gameWorld.scene.remove(existing.mesh);
                this.gameWorld.world.removeBody(existing.body);
                // Remove from lists
                this.gameWorld.stations = this.gameWorld.stations.filter(s => s !== existing);
                this.gameWorld.world.interactables = this.gameWorld.world.interactables.filter(m => m !== existing.mesh);
            }
        }
    }
}
