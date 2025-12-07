import * as THREE from 'three';
import { Ingredient, IngredientType } from './Ingredient.js';

export class PlateItem {
    constructor(scene) {
        this.scene = scene;
        this.type = 'plate_item'; // Special type

        // Visuals
        const geometry = new THREE.CylinderGeometry(0.4, 0.3, 0.1, 16);
        this.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);

        this.isHeld = false;
        this.heldIngredients = [];

        // Whitelist allowed ingredients (Ready to serve)
        this.allowedIngredients = [
            IngredientType.BURGER,
            IngredientType.CHOPPED_LETTUCE,
            IngredientType.CHOPPED_TOMATO
        ];
    }

    addIngredient(ingredientType) {
        if (!this.allowedIngredients.includes(ingredientType)) {
            console.log(`Cannot add ${ingredientType} to plate!`);
            return false;
        }

        // Visual representation of ingredient on plate
        // Reuse Ingredient class for visuals, but scaled down
        const visualItem = new Ingredient(null, ingredientType);
        const miniMesh = visualItem.mesh;

        miniMesh.scale.set(0.5, 0.5, 0.5);
        // Reset position relative to parent plate (Ingredient usually centers geometry)
        // Plate stacking logic:
        miniMesh.position.set(0, 0.1 + (this.heldIngredients.length * 0.15), 0);

        this.mesh.add(miniMesh);

        this.heldIngredients.push({ type: ingredientType, mesh: miniMesh, visualItem: visualItem });
        return true;
    }

    // Getter for ingredients list
    get ingredients() {
        return this.heldIngredients.map(i => i.type);
    }

    // Sync state from server
    syncIngredients(list) {
        // Clear current
        this.heldIngredients.forEach(i => {
            this.mesh.remove(i.mesh);
            if (i.visualItem) i.visualItem.destroy();
        });
        this.heldIngredients = [];

        // Rebuild from list
        list.forEach(type => {
            // Bypass check for sync
            this.forceAddIngredient(type);
        });
    }

    forceAddIngredient(ingredientType) {
        const visualItem = new Ingredient(null, ingredientType);
        const miniMesh = visualItem.mesh;

        miniMesh.scale.set(0.5, 0.5, 0.5);
        miniMesh.position.set(0, 0.1 + (this.heldIngredients.length * 0.15), 0);

        this.mesh.add(miniMesh);
        this.heldIngredients.push({ type: ingredientType, mesh: miniMesh, visualItem: visualItem });
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.material.dispose();
        this.mesh.geometry.dispose();
        // Clean up ingredient visuals
        this.heldIngredients.forEach(i => {
            if (i.visualItem) i.visualItem.destroy();
        });
    }
}
