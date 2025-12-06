import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Player {
    constructor(scene, world, position = new CANNON.Vec3(0, 5, 0)) {
        this.scene = scene;
        this.world = world;
        this.speed = 10; // Reduced speed after friction fix
        this.input = { up: false, down: false, left: false, right: false };

        // Visuals - Procedural Chef
        this.createVisuals();

        this.mesh.position.copy(position);
        this.scene.add(this.mesh);

        // Physics
        this.body = new CANNON.Body({
            mass: 50, // kg
            shape: new CANNON.Box(new CANNON.Vec3(0.4, 0.75, 0.4)),
            position: position,
            fixedRotation: true, // Prevent tumbling
            material: world.materials.player
        });
        this.body.linearDamping = 0; // No damping to ensure constant speed
        this.world.addBody(this.body);

        this.heldItem = null;
        this.focusedStation = null;
        this.initInput();
    }

    createVisuals() {
        this.mesh = new THREE.Group();
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Materials with Randomization
        const skinColors = [0xffccaa, 0x8d5524, 0xc68642, 0xe0ac69, 0xf1c27d, 0xffdbac]; // Diverse skin tones
        const randomSkin = skinColors[Math.floor(Math.random() * skinColors.length)];
        const skinMat = new THREE.MeshStandardMaterial({ color: randomSkin });

        // Helper for random vibrant clothing color
        const randColor = () => new THREE.Color().setHSL(Math.random(), 0.8, 0.4);

        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Keep Hat/Shirt White for classic chef look? 
        // User asked for "each part" to randomize. Let's randomize Shirt too but maybe keep Hat white? 
        // Or randomize everything. references: "make the colors of each part of the chef randomize"
        // I will randomize Shirt (Torso) but Separate Hat.

        const shirtMat = new THREE.MeshStandardMaterial({ color: randColor() });
        const hatMat = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Keep hat white to stay recognizable as Chef

        const apronMat = new THREE.MeshStandardMaterial({ color: randColor() });
        const pantsMat = new THREE.MeshStandardMaterial({ color: randColor() });
        const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111 }); // Shoes dark

        // --- Body Group (Bobbing part) ---
        this.bodyGroup = new THREE.Group();
        this.mesh.add(this.bodyGroup);

        // Torso
        const torsoGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.6, 8);
        const torso = new THREE.Mesh(torsoGeo, shirtMat);
        torso.position.y = 0.7;
        torso.castShadow = true;
        this.bodyGroup.add(torso);

        // Apron
        const apronGeo = new THREE.BoxGeometry(0.72, 0.5, 0.05); // Slightly wider than body
        const apron = new THREE.Mesh(apronGeo, apronMat);
        apron.position.set(0, 0.65, 0.38); // Front
        apron.castShadow = true;
        this.bodyGroup.add(apron);
        // Apron string
        const stringGeo = new THREE.BoxGeometry(0.74, 0.05, 0.74);
        const string = new THREE.Mesh(stringGeo, apronMat);
        string.position.set(0, 0.85, 0);
        this.bodyGroup.add(string);


        // Head
        const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
        this.head = new THREE.Mesh(headGeo, skinMat); // Store for look-at if needed
        this.head.position.y = 1.25;
        this.head.castShadow = true;
        this.bodyGroup.add(this.head);

        // Hat (Toque)
        const hatBrimGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
        const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
        hatBrim.position.y = 1.55;
        this.bodyGroup.add(hatBrim);

        const hatTopGeo = new THREE.CylinderGeometry(0.45, 0.35, 0.5, 16); // Puffy top
        const hatTop = new THREE.Mesh(hatTopGeo, hatMat);
        hatTop.position.y = 1.85;
        this.bodyGroup.add(hatTop);

        // Arms (Pivots at shoulder)
        // Shoulder pos: +/- 0.45, 0.9, 0
        this.leftArm = this.createLimb(0.12, 0.6, shirtMat, skinMat);
        this.leftArm.position.set(-0.45, 0.9, 0);
        this.bodyGroup.add(this.leftArm);

        this.rightArm = this.createLimb(0.12, 0.6, shirtMat, skinMat);
        this.rightArm.position.set(0.45, 0.9, 0);
        this.bodyGroup.add(this.rightArm);

        // Legs (Pivots at hip)
        // Hip pos: +/- 0.2, 0.4, 0
        this.leftLeg = this.createLimb(0.15, 0.6, pantsMat, shoeMat);
        this.leftLeg.position.set(-0.2, 0.4, 0);
        this.mesh.add(this.leftLeg);

        this.rightLeg = this.createLimb(0.15, 0.6, pantsMat, shoeMat);
        this.rightLeg.position.set(0.2, 0.4, 0);
        this.mesh.add(this.rightLeg);
    }

    createLimb(width, length, upperMat, lowerMat) {
        const pivot = new THREE.Group();

        const upperGeo = new THREE.CylinderGeometry(width, width, length * 0.8, 8);
        const upper = new THREE.Mesh(upperGeo, upperMat);
        upper.position.y = -length * 0.4;
        upper.castShadow = true;
        pivot.add(upper);

        // Hand/Shoe
        const lowerGeo = new THREE.SphereGeometry(width * 1.2, 8, 8);
        const lower = new THREE.Mesh(lowerGeo, lowerMat);
        lower.position.y = -length * 0.85;
        lower.castShadow = true;
        pivot.add(lower);

        return pivot;
    }

    initInput() {
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));
    }

    handleKey(e, isDown) {
        if (e.repeat) return;
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': this.input.up = isDown; break;
            case 'KeyS': case 'ArrowDown': this.input.down = isDown; break;
            case 'KeyA': case 'ArrowLeft': this.input.left = isDown; break;
            case 'KeyD': case 'ArrowRight': this.input.right = isDown; break;
            case 'Space':
                if (isDown) this.tryInteract();
                break;
            case 'KeyE':
                if (isDown) this.tryWork(); // New Work Action
                break;
            case 'KeyF':
                if (isDown && this.heldItem) this.dropItem();
                break;
        }
    }

    update(time = 0) {
        const vel = this.body.velocity;
        const inputVector = new CANNON.Vec3(0, 0, 0);

        if (this.input.up) inputVector.z -= 1;
        if (this.input.down) inputVector.z += 1;
        if (this.input.left) inputVector.x -= 1;
        if (this.input.right) inputVector.x += 1;

        // Manual normalization to guarantee consistency
        const length = Math.sqrt(inputVector.x * inputVector.x + inputVector.z * inputVector.z);
        const isMoving = length > 0;

        if (isMoving) {
            const normalizedX = inputVector.x / length;
            const normalizedZ = inputVector.z / length;

            // User requested specific speed boost for diagonal movement
            const isDiagonal = (inputVector.x !== 0 && inputVector.z !== 0);
            const currentSpeed = isDiagonal ? this.speed * 1.3333 : this.speed;

            // Rotation
            this.mesh.rotation.y = Math.atan2(normalizedX, normalizedZ);

            // Velocity
            this.body.velocity.x = normalizedX * currentSpeed;
            this.body.velocity.z = normalizedZ * currentSpeed;
        } else {
            this.body.velocity.x = 0;
            this.body.velocity.z = 0;
        }

        // Sync mesh
        this.mesh.position.copy(this.body.position);
        this.mesh.position.y -= 0.75; // Align visual feet to physics bottom

        // Sync held item
        if (this.heldItem) {
            // Keep object steady in front/above, regardless of bobbing
            const carryPos = new THREE.Vector3(0, 1.0, 0.8); // Local offset: Chest height, further forward
            carryPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
            carryPos.add(this.mesh.position);

            this.heldItem.mesh.position.copy(carryPos);
            this.heldItem.mesh.rotation.copy(this.mesh.rotation);
        }

        this.highlightFocusedObject();
        this.animate(time, isMoving);
    }

    animate(time, isMoving) {
        const t = time / 1000; // Convert ms to seconds
        if (isMoving) {
            const walkSpeed = 10;
            const amp = 0.6; // arm swing amplitude

            // Legs
            this.leftLeg.rotation.x = Math.sin(t * walkSpeed) * amp;
            this.rightLeg.rotation.x = Math.sin(t * walkSpeed + Math.PI) * amp;

            // Arms (Swing opposite to legs)
            this.leftArm.rotation.x = Math.sin(t * walkSpeed + Math.PI) * amp;
            this.rightArm.rotation.x = Math.sin(t * walkSpeed) * amp;

            // Body Bob
            this.bodyGroup.position.y = Math.abs(Math.sin(t * walkSpeed * 2)) * 0.05;
        } else {
            // Idle Pose
            const breathSpeed = 2;
            this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 0.1);
            this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 0.1);

            // Carrying pose handling would go here, for now arms relax
            this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, 0.1);
            this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, 0.1);

            // Respiration
            this.bodyGroup.position.y = Math.sin(t * breathSpeed) * 0.02;
        }
    }

    highlightFocusedObject() {
        const target = this.getInteractTarget();

        if (this.focusedStation && this.focusedStation !== target) {
            this.focusedStation.setHighlight(false);
        }

        this.focusedStation = target;

        if (this.focusedStation) {
            this.focusedStation.setHighlight(true);
        }
    }

    getInteractTarget() {
        const interactRadius = 2.0;
        const playerPos = this.mesh.position.clone();
        playerPos.y += 1.0; // Raycast from chest height

        // Raycast from player forward
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);

        const rayStart = playerPos.clone().add(new THREE.Vector3(0, 0, 0)); // No offset needed if cloned

        const raycaster = new THREE.Raycaster(playerPos, forward, 0, interactRadius);

        if (!this.world.interactables) return null;

        const intersects = raycaster.intersectObjects(this.world.interactables, false);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            if (hit.userData.interactable) {
                return hit.userData.interactable;
            }
        }
        return null;
    }

    tryInteract() {
        if (this.focusedStation) {
            this.focusedStation.interact(this);
        }
    }

    tryWork() {
        if (this.focusedStation && this.focusedStation.work) {
            this.focusedStation.work(this);
            // Visual flair: Animate arms chop?
            // Simple hack:
            this.rightArm.rotation.x = -Math.PI / 2;
            setTimeout(() => { this.rightArm.rotation.x = 0; }, 100);
        }
    }

    holdItem(ingredient) {
        if (this.heldItem) return;
        this.heldItem = ingredient;
        ingredient.isHeld = true;
    }

    dropItem() {
        if (!this.heldItem) return;
        this.heldItem.isHeld = false;
        this.heldItem.mesh.position.y = 0.2;
        this.heldItem = null;
    }
}
