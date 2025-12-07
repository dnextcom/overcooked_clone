import { Station } from './Station.js';
import * as THREE from 'three';

export class DeliveryStation extends Station {
    constructor(scene, world, position, orderManager) {
        super(scene, world, position, 0x222222); // Dark station
        this.orderManager = orderManager;

        // Conveyor belt or window visual
        const beltGeo = new THREE.BoxGeometry(1.4, 0.1, 1.4);
        const beltMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const belt = new THREE.Mesh(beltGeo, beltMat);
        belt.position.y = 0.55;
        this.mesh.add(belt);

        // Arrow graphics? Not essential for MVP
    }

    interact(player) {
        if (player.heldItem && player.heldItem.type === 'plate_item') {
            const plate = player.heldItem;

            // Validate
            // Convert plate ingredients (strings) to objects expected by OrderManager if needed, 
            // OR just fix OrderManager/RecipeSystem to expect strings?
            // RecipeSystem maps .type: const plateTypes = plateIngredients.map(i => i.type).sort();
            // So we should pass objects { type: "..." }

            const ingredients = plate.ingredients.map(i => ({ type: i }));

            // NOTE: PlateItem.ingredients getter returns plain strings ['chopped_tomato', ...]
            // So map them back to {type: string} for compatibility with existing RecipeSystem

            // Only run scoring logic if we are the authority (local player)
            // If remote player, we just simulate the visual delivery
            if (!player.isRemote) {
                const result = this.orderManager.deliverPlate(ingredients);

                if (result && result.success) {
                    // Flash Green
                    this.flashColor(0x00ff00);
                } else {
                    // Flash Red
                    this.flashColor(0xff0000);
                }
            } else {
                // Visual feedback only for remote
                this.flashColor(0x00ff00); // Assume success visual for smoothness? 
                // Or wait for score update? 
                // Better to just show interaction feedback.
            }

            // Always take the plate? OR only if success? 
            // In Overcooked, correct orders disappear, incorrect ones stay? 
            // For MVP: Conveyor takes everything.
            player.dropItem();
            plate.destroy();
        }
    }

    flashColor(hex) {
        this.material.emissive.setHex(hex);
        setTimeout(() => this.material.emissive.setHex(0x000000), 500);
    }
}
