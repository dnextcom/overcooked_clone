import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Station {
    constructor(scene, world, position, color = 0x885522) {
        this.scene = scene;
        this.world = world;

        // Visuals
        const geometry = new THREE.BoxGeometry(1.5, 1, 1.5);
        this.material = new THREE.MeshStandardMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.copy(position);
        this.mesh.position.y += 0.5; // Rest on floor
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.interactable = this; // Link back to class
        this.scene.add(this.mesh);

        // Physics
        const shape = new CANNON.Box(new CANNON.Vec3(0.75, 0.5, 0.75));
        this.body = new CANNON.Body({
            mass: 0, // Static
            position: new CANNON.Vec3(position.x, 0.5, position.z),
            shape: shape,
            material: world.materials.default
        });
        this.world.addBody(this.body);

        this.highlighted = false;
        this.originalColor = color;
    }

    setHighlight(isHighlighted) {
        if (this.highlighted === isHighlighted) return;
        this.highlighted = isHighlighted;
        if (isHighlighted) {
            this.material.emissive.setHex(0x333333);
        } else {
            this.material.emissive.setHex(0x000000);
        }
    }

    interact(player) {
        console.log("Interacted with Station!");
        // Override in subclasses
    }

    work(player) {
        // Override for chopping/cooking
    }
}
