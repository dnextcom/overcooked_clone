import * as THREE from 'three';

export const IngredientType = {
    TOMATO: 'tomato',
    LETTUCE: 'lettuce',
    MEAT: 'meat',
    CHOPPED_TOMATO: 'chopped_tomato',
    CHOPPED_LETTUCE: 'chopped_lettuce',
    CHOPPED_MEAT: 'chopped_meat',
    BURGER: 'burger'
};

export class Ingredient {
    constructor(scene, type) {
        this.scene = scene;
        this.type = type;

        let color = 0xffffff;
        let geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);

        switch (type) {
            case IngredientType.TOMATO:
                color = 0xff0000;
                geometry = new THREE.SphereGeometry(0.25, 16, 16);
                break;
            case IngredientType.LETTUCE:
                color = 0x55ff55; // Lighter green
                geometry = new THREE.IcosahedronGeometry(0.25, 0); // Rough leafy shape
                break;
            case IngredientType.MEAT:
                color = 0x8B4513;
                geometry = new THREE.BoxGeometry(0.4, 0.2, 0.4); // Slab
                break;
            case IngredientType.CHOPPED_TOMATO:
                color = 0xaa0000;
                geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3); // Cubes
                break;
            case IngredientType.CHOPPED_LETTUCE:
                color = 0x00aa00;
                geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                break;
            case IngredientType.CHOPPED_MEAT:
                color = 0x552200;
                geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                break;
            case IngredientType.BURGER:
                color = 0x654321;
                geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16); // Patty
                break;
        }

        this.material = new THREE.MeshStandardMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.castShadow = true;
        if (this.scene) {
            this.scene.add(this.mesh);
        }

        this.isHeld = false;
    }

    destroy() {
        if (this.scene) {
            this.scene.remove(this.mesh);
        }
        this.material.dispose();
        this.mesh.geometry.dispose();
    }
}
