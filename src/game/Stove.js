import { Station } from './Station.js';
import { Ingredient, IngredientType } from './Ingredient.js';
import * as THREE from 'three';

export class Stove extends Station {
    constructor(scene, world, position) {
        super(scene, world, position, 0x444444); // Dark grey stove

        // Visuals: Burner
        const burnerGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        const burnerMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const burner = new THREE.Mesh(burnerGeo, burnerMat);
        burner.position.y = 0.55;
        this.mesh.add(burner);

        // Progress Bar
        const barGeo = new THREE.BoxGeometry(1.0, 0.2, 0.1);
        const barMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.progressBar = new THREE.Mesh(barGeo, barMat);
        this.progressBar.position.y = 2.0;
        this.progressBar.visible = false;
        this.mesh.add(this.progressBar);

        this.heldItem = null;
        this.cookingProgress = 0;
        this.isCooking = false;

        // Cookable map: Input Type -> Output Type
        this.cookables = {
            'chopped_meat': IngredientType.BURGER
        };
    }

    interact(player) {
        // Case 1: Player has item -> Place on stove
        if (player.heldItem && !this.heldItem) {
            const item = player.heldItem;
            player.dropItem();

            this.heldItem = item;
            this.heldItem.mesh.position.copy(this.mesh.position);
            this.heldItem.mesh.position.y += 1.0;
            this.heldItem.isHeld = false;

            // Check if cookable
            if (this.cookables[this.heldItem.type]) {
                this.isCooking = true;
                this.progressBar.visible = true;
                this.progressBar.scale.x = 0;
            }
            return;
        }

        // Case 3: Player has Plate, Stove has Item -> Add to Plate
        if (player.heldItem && player.heldItem.type === 'plate_item' && this.heldItem && !this.isCooking) {
            if (player.heldItem.addIngredient(this.heldItem.type)) {
                this.heldItem.destroy(); // Remove stove item
                this.heldItem = null;
                this.cookingProgress = 0;
                this.progressBar.visible = false;
            }
            return;
        }

        // Case 2: Player empty hand -> Pick up
        if (!player.heldItem && this.heldItem) {
            player.holdItem(this.heldItem);
            this.heldItem = null;
            this.isCooking = false;
            this.cookingProgress = 0;
            this.progressBar.visible = false;
            return;
        }
    }

    update(dt) {
        if (this.isCooking && this.heldItem) {
            this.cookingProgress += dt * 10; // Cook speed

            // Update visual bar
            const percent = Math.min(this.cookingProgress / 100, 1.0);
            this.progressBar.scale.x = percent;

            // Color shift from Green to Red if it burns? (Future feature)

            if (this.cookingProgress >= 100) {
                this.finishCooking();
            }
        }
    }

    finishCooking() {
        this.isCooking = false;
        this.cookingProgress = 0;
        this.progressBar.visible = false;

        const newType = this.cookables[this.heldItem.type];
        console.log(`Cooked! Became ${newType}`);

        // Change visuals
        // Create new visible item with correct geometry/type
        const oldPos = this.heldItem.mesh.position.clone();
        this.heldItem.destroy(); // Remove old mesh

        const newItem = new Ingredient(this.scene, newType);
        newItem.mesh.position.copy(oldPos);
        newItem.isHeld = false;

        this.heldItem = newItem;
        console.log(`Cooked! Replaced with ${newType}`);
    }
}
