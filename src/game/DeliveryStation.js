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
            // Convert plate ingredients to cleaner format if needed
            const ingredients = plate.getIngredients().map(i => ({ type: i.type }));

            // Use OrderManager (we need to update OrderManager signature possibly or make sure it handles this format)
            // Previously: OrderManager.deliverPlate(plateItems) where plateItems was array of Ingredients. 
            // Now we send array of {type:...} or just mock Ingredient objects?
            // Let's check OrderManager.deliverPlate expectations.
            // It calls `RecipeSystem.validateRecipe(plateItems)` which maps `i.type`.
            // So passing `{type: '...'}` objects is sufficient!

            const success = this.orderManager.deliverPlate(ingredients);

            if (success) {
                // Flash Green
                this.flashColor(0x00ff00);
            } else {
                // Flash Red
                this.flashColor(0xff0000);
            }

            // Always take the plate? OR only if success? 
            // In Overcooked, correct orders disappear, incorrect ones stay? 
            // Or incorrect ones go to trash.
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
