import { Station } from './Station.js';
import { Ingredient } from './Ingredient.js';

export class Crate extends Station {
    constructor(scene, world, position, ingredientType) {
        // Color based on ingredient for now
        let color = 0x8B4513; // default
        if (ingredientType === 'tomato') color = 0xffaaaa;
        if (ingredientType === 'lettuce') color = 0xaaffaa;

        super(scene, world, position, color);
        this.ingredientType = ingredientType;
    }

    interact(player) {
        if (!player.heldItem) {
            console.log(`Spawning ${this.ingredientType}`);
            const ingredient = new Ingredient(this.scene, this.ingredientType);
            player.holdItem(ingredient);
        }
    }
}
