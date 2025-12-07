// src/game/RemotePlayer.js
// Simple placeholder for remote players (visual only)
import * as THREE from 'three';

export class RemotePlayer {
    constructor(scene, id) {
        this.scene = scene;
        this.id = id;
        this.isRemote = true;
        this.targetPosition = new THREE.Vector3(0, 0, 0);

        this.createVisuals();
        this.mesh.castShadow = true;
        scene.add(this.mesh);
    }


    createVisuals(colors = null) {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            // Dispose geometry/materials if needed, but ThreeJS handles some cleanup.
            // For rigorous cleanup we should dispose.
        }

        this.mesh = new THREE.Group();

        let skinC, shirtC, hatC, apronC, pantsC, shoeC;
        if (colors) {
            skinC = colors.skin;
            shirtC = colors.shirt;
            hatC = colors.hat;
            apronC = colors.apron;
            pantsC = colors.pants;
            shoeC = colors.shoe;
        } else {
            // Generate consistent random color based on ID string
            const seed = this.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const rand = (n) => {
                const x = Math.sin(seed + n) * 10000;
                return x - Math.floor(x);
            };

            const skinColors = [0xffccaa, 0x8d5524, 0xc68642, 0xe0ac69, 0xf1c27d, 0xffdbac];
            skinC = skinColors[Math.floor(rand(1) * skinColors.length)];
            shirtC = new THREE.Color().setHSL(rand(2), rand(3), 0.4).getHex();
            hatC = 0xffffff;
            apronC = new THREE.Color().setHSL(rand(4), rand(5), 0.4).getHex();
            pantsC = new THREE.Color().setHSL(rand(6), rand(7), 0.4).getHex();
            shoeC = 0x111111;
        }

        const skinMat = new THREE.MeshStandardMaterial({ color: skinC });
        const shirtMat = new THREE.MeshStandardMaterial({ color: shirtC });
        const hatMat = new THREE.MeshStandardMaterial({ color: hatC });
        const apronMat = new THREE.MeshStandardMaterial({ color: apronC });
        const pantsMat = new THREE.MeshStandardMaterial({ color: pantsC });
        const shoeMat = new THREE.MeshStandardMaterial({ color: shoeC });

        // --- Body Group (Bobbing part) ---
        this.bodyGroup = new THREE.Group();
        this.mesh.add(this.bodyGroup);

        // Torso
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.6, 8), shirtMat);
        torso.position.y = 0.7;
        torso.castShadow = true;
        this.bodyGroup.add(torso);

        // Apron
        const apron = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.5, 0.05), apronMat);
        apron.position.set(0, 0.65, 0.38);
        apron.castShadow = true;
        this.bodyGroup.add(apron);

        // Apron string
        const string = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.05, 0.74), apronMat);
        string.position.set(0, 0.85, 0);
        this.bodyGroup.add(string);

        // Head
        this.head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), skinMat);
        this.head.position.y = 1.25;
        this.head.castShadow = true;
        this.bodyGroup.add(this.head);

        // Hat
        const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16), hatMat);
        hatBrim.position.y = 1.55;
        this.bodyGroup.add(hatBrim);

        const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.5, 16), hatMat);
        hatTop.position.y = 1.85;
        this.bodyGroup.add(hatTop);

        // Limbs helper
        const createLimb = (w, l, uMat, lMat) => {
            const pivot = new THREE.Group();
            const upper = new THREE.Mesh(new THREE.CylinderGeometry(w, w, l * 0.8, 8), uMat);
            upper.position.y = -l * 0.4;
            upper.castShadow = true;
            pivot.add(upper);
            const lower = new THREE.Mesh(new THREE.SphereGeometry(w * 1.2, 8, 8), lMat);
            lower.position.y = -l * 0.85;
            lower.castShadow = true;
            pivot.add(lower);
            return pivot;
        };

        // Arms
        this.leftArm = createLimb(0.12, 0.6, shirtMat, skinMat);
        this.leftArm.position.set(-0.45, 0.9, 0);
        this.bodyGroup.add(this.leftArm);

        this.rightArm = createLimb(0.12, 0.6, shirtMat, skinMat);
        this.rightArm.position.set(0.45, 0.9, 0);
        this.bodyGroup.add(this.rightArm);

        // Legs
        this.leftLeg = createLimb(0.15, 0.6, pantsMat, shoeMat);
        this.leftLeg.position.set(-0.2, 0.4, 0);
        this.mesh.add(this.leftLeg);

        this.rightLeg = createLimb(0.15, 0.6, pantsMat, shoeMat);
        this.rightLeg.position.set(0.2, 0.4, 0);
        this.mesh.add(this.rightLeg);

        // Align visual feet like local player
        this.mesh.position.y -= 0.75;
    }

    setPosition(pos) {
        this.targetPosition.set(pos.x, pos.y - 0.75, pos.z); // Adjust y for visual alignment
        if (this.mesh.position.lengthSq() === 0 && (pos.x !== 0 || pos.z !== 0)) {
            this.mesh.position.copy(this.targetPosition);
        }
        if (pos.heldItem !== undefined) {
            this.setHeldItem(pos.heldItem);
        }
    }

    // Interaction support logic
    holdItem(ingredient) {
        if (this.heldItem) return;
        this.heldItem = ingredient;
        ingredient.isHeld = true;
        this.currentHeldItemName = ingredient.type;


        // Attach to mesh visually
        this.mesh.add(ingredient.mesh);
        ingredient.mesh.position.set(0, 1.0, 0.8); // Same offset as Player.js
        ingredient.mesh.rotation.copy(this.mesh.rotation);

        // Clear virtual if any
        if (this.heldMesh) {
            this.mesh.remove(this.heldMesh);
            this.heldMesh = null;
        }
    }

    dropItem() {
        // Drop real held item if we have one
        if (this.heldItem) {
            this.heldItem.isHeld = false;
            // Add the item mesh back to the scene (floor)
            this.scene.add(this.heldItem.mesh);
            this.heldItem.mesh.position.copy(this.mesh.position);
            this.heldItem.mesh.position.y = 0.2;
            this.heldItem = null;
        }
        // Remove placeholder heldMesh if present (used for remote prediction)
        if (this.heldMesh) {
            this.mesh.remove(this.heldMesh);
            this.heldMesh = null;
        }
        this.currentHeldItemName = null;
        // Prevent immediate server re-sync that would re-add the item
        this.ignoreSyncUntil = Date.now() + 500;
    }

    setHeldItem(itemName) {
        if (this.heldItem) return; // Physics/Interaction logic takes precedence



        if (this.currentHeldItemName === itemName) return;
        this.currentHeldItemName = itemName;

        // Remove old item
        if (this.heldMesh) {
            this.mesh.remove(this.heldMesh);
            this.heldMesh = null;
        }

        if (!itemName) return;

        // Create visual for new item
        // Simple color mapping for now
        let color = 0x888888;
        if (itemName === 'Tomato') color = 0xff0000;
        else if (itemName === 'Lettuce') color = 0x00ff00;
        else if (itemName === 'Plate') color = 0xffffff;
        else if (itemName === 'Bun') color = 0xffaa00;
        else if (itemName === 'Patty') color = 0x550000;

        // Use a simple shape
        let geometry;
        if (itemName === 'Plate') geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
        else if (itemName === 'Patty') geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
        else geometry = new THREE.SphereGeometry(0.2, 8, 8);

        const material = new THREE.MeshStandardMaterial({ color });
        this.heldMesh = new THREE.Mesh(geometry, material);

        // Position visually in "hands"
        this.heldMesh.position.set(0, 1.0, 0.5);
        this.heldMesh.castShadow = true;
        this.mesh.add(this.heldMesh);
    }

    update(dt) {
        const speed = 25;
        if (this.mesh.position.distanceTo(this.targetPosition) > 0.01) {
            this.mesh.position.lerp(this.targetPosition, speed * dt);

            // Rotation based on movement direction
            const dir = new THREE.Vector3().subVectors(this.targetPosition, this.mesh.position);
            if (dir.lengthSq() > 0.001) {
                this.mesh.rotation.y = Math.atan2(dir.x, dir.z);

                // Animate walking
                const t = Date.now() / 1000;
                const walkSpeed = 10;
                const amp = 0.6;
                this.leftLeg.rotation.x = Math.sin(t * walkSpeed) * amp;
                this.rightLeg.rotation.x = Math.sin(t * walkSpeed + Math.PI) * amp;
                this.leftArm.rotation.x = Math.sin(t * walkSpeed + Math.PI) * amp;
                this.rightArm.rotation.x = Math.sin(t * walkSpeed) * amp;
                this.bodyGroup.position.y = Math.abs(Math.sin(t * walkSpeed * 2)) * 0.05;
            }
        } else {
            // Idle animation
            this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 0.1);
            this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 0.1);
            this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, 0.1);
            this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, 0.1);
            this.bodyGroup.position.y = Math.sin(Date.now() / 1000 * 2) * 0.02;
        }
    }
    updateColors(colors) {
        if (!colors) return;

        // Simple equality check to prevent constant rebuilding (which kills animation state)
        if (JSON.stringify(this.currentColors) === JSON.stringify(colors)) return;

        this.currentColors = colors;
        this.createVisuals(colors);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);

        // Restore position
        const pos = this.targetPosition.clone();
        this.mesh.position.copy(pos);
    }
}
