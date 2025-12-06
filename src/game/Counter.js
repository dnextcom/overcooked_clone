import { Station } from './Station.js';

export class Counter extends Station {
    constructor(scene, world, position) {
        super(scene, world, position, 0xaaaaaa); // Grey counter // Fixed syntax error on color
        this.heldItem = null;
    }

    interact(player) {
        // 1. Player empty hand, Counter has item -> Pickup
        if (!player.heldItem && this.heldItem) {
            player.holdItem(this.heldItem);
            this.heldItem = null;
            return;
        }

        // 2. Player has item, Counter empty -> Place
        if (player.heldItem && !this.heldItem) {
            const item = player.heldItem;
            player.dropItem();

            this.heldItem = item;
            this.heldItem.mesh.position.copy(this.mesh.position);
            this.heldItem.mesh.position.y += 1.0;
            return;
        }

        // 3. Player has Ingredient, Counter has PLATE -> Add to plate
        if (player.heldItem && this.heldItem && this.heldItem.type === 'plate_item') {
            const ingredient = player.heldItem;
            // Check if it's a valid ingredient to plate?
            if (ingredient.type !== 'plate_item') {
                if (this.heldItem.addIngredient(ingredient.type)) {
                    player.dropItem();
                    ingredient.destroy(); // Destroy original object, add to plate data
                }
            }
            return;
        }

        // 4. Player has PLATE, Counter has INGREDIENT -> Add to plate
        if (player.heldItem && player.heldItem.type === 'plate_item' && this.heldItem) {
            // Prevent packing a plate into a plate?
            if (this.heldItem.type !== 'plate_item') {
                if (player.heldItem.addIngredient(this.heldItem.type)) {
                    this.heldItem.destroy();
                    this.heldItem = null;
                }
                return;
            }
        }
    }
}
