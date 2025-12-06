import { Station } from './Station.js';
import { Ingredient, IngredientType } from './Ingredient.js';
import * as THREE from 'three';

export class ChoppingBoard extends Station {
    constructor(scene, world, position) {
        super(scene, world, position, 0xdddddd); // White-ish board

        // Add visual detail (knife or cutting mat)
        const matGeo = new THREE.BoxGeometry(1.2, 0.1, 1.0);
        const matMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const matMesh = new THREE.Mesh(matGeo, matMat);
        matMesh.position.y = 0.55;
        this.mesh.add(matMesh);

        this.heldItem = null;
        this.progress = 0;
        this.isChopping = false;

        // Choppable items map
        this.choppables = {
            [IngredientType.TOMATO]: IngredientType.CHOPPED_TOMATO,
            [IngredientType.LETTUCE]: IngredientType.CHOPPED_LETTUCE,
            [IngredientType.MEAT]: IngredientType.CHOPPED_MEAT
        };
    }

    interact(player) {
        // Case 1: Player has item, board is empty -> Place item
        if (player.heldItem && !this.heldItem) {
            const item = player.heldItem;
            // Validate if placeable? For now, allow placing anything (or valid ingredients)
            player.dropItem(); // Detach from player

            // Attach to board
            this.heldItem = item;
            this.heldItem.mesh.position.copy(this.mesh.position);
            this.heldItem.mesh.position.y += 1.0;
            this.heldItem.isHeld = false; // It's on station

            this.progress = 0;
            console.log("Placed item on board");
            return;
        }

        // Case 3: Player has Plate, Board has Item -> Add to Plate
        if (player.heldItem && player.heldItem.type === 'plate_item' && this.heldItem && !this.isChopping) {
            if (player.heldItem.addIngredient(this.heldItem.type)) {
                this.heldItem.destroy(); // Remove board item
                this.heldItem = null;
                this.progress = 0;
            }
            return;
        }

        // Case 2: Player empty hand, board has item -> Pick up item
        if (!player.heldItem && this.heldItem && !this.isChopping) {
            player.holdItem(this.heldItem);
            this.heldItem = null;
            this.progress = 0;
            console.log("Picked up item from board");
            return;
        }
    }

    work(player) {
        // Case 3: Chop action
        if (this.heldItem && this.choppables[this.heldItem.type]) {
            this.chop();
        }
    }

    chop() {
        if (this.progress >= 100) return;

        this.progress += 25; // 4 chops to finish
        console.log(`Chopping... ${this.progress}%`);

        // Visual feedback (shake or particle)
        this.heldItem.mesh.scale.setScalar(1.0 - (this.progress / 200)); // Shrink slightly

        if (this.progress >= 100) {
            this.finishChopping();
        }
    }

    finishChopping() {
        console.log("Chopping finished!");

        // Transform item
        const newType = this.choppables[this.heldItem.type];

        // Transform item by respawning
        const oldPos = this.heldItem.mesh.position.clone();
        this.heldItem.destroy();

        const newItem = new Ingredient(this.scene, newType);
        newItem.mesh.position.copy(oldPos);
        newItem.isHeld = false;

        this.heldItem = newItem;
    }
}
