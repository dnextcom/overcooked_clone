import { Station } from './Station.js';
import { PlateItem } from './PlateItem.js';
import * as THREE from 'three';

export class PlateDispenser extends Station {
    constructor(scene, world, position) {
        super(scene, world, position, 0x444444); // Dark grey stack

        // Visual stack of plates
        const stackGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.6, 16);
        const stackMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const stack = new THREE.Mesh(stackGeo, stackMat);
        stack.position.y = 0.8;
        this.mesh.add(stack);
    }

    interact(player) {
        // Case 1: Player empty hand -> Grab plate
        if (!player.heldItem) {
            console.log("Grabbed new plate");
            const plate = new PlateItem(this.scene);
            player.holdItem(plate);
            return;
        }

        // Case 2: Player holding ingredient -> Try to plate it and pick up plate
        if (player.heldItem.type !== 'plate_item') {
            const plate = new PlateItem(this.scene);

            if (plate.addIngredient(player.heldItem.type)) {
                // Success: Ingredient fits on plate
                console.log("Auto-plated item from dispenser");

                // Remove ingredient from world/player
                player.heldItem.destroy();
                player.heldItem = null; // Clear ref so we can hold new item

                // Pick up the prepared plate
                player.holdItem(plate);
            } else {
                // Fail: Ingredient not plateable (e.g. raw meat)
                plate.destroy(); // Cancel plate creation
            }
        }
    }
}
