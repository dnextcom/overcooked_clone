import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Crate } from './Crate.js';
import { IngredientType } from './Ingredient.js';
import { ChoppingBoard } from './ChoppingBoard.js';
import { Stove } from './Stove.js';
import { PlateDispenser } from './PlateDispenser.js';
import { Counter } from './Counter.js';
import { DeliveryStation } from './DeliveryStation.js';

export class LevelManager {
    constructor(gameWorld) {
        this.gameWorld = gameWorld;
    }

    clearLevel() {
        // Destroy all existing stations
        if (this.gameWorld.stations) {
            for (const station of this.gameWorld.stations) {
                if (station.mesh) this.gameWorld.scene.remove(station.mesh);
                if (station.body) this.gameWorld.world.removeBody(station.body);
            }
        }
        this.gameWorld.stations = [];
        this.gameWorld.world.interactables = [];
    }

    loadLevel(data) {
        this.clearLevel();

        if (!data || !data.stations) return;

        for (const sData of data.stations) {
            this.spawnStation(sData.type, sData.x, sData.z, sData.properties);
        }
    }

    spawnStation(type, x, z, properties = {}) {
        const pos = new CANNON.Vec3(x, 0, z);
        let station = null;

        switch (type) {
            case 'crate_tomato':
                station = new Crate(this.gameWorld.scene, this.gameWorld.world, pos, IngredientType.TOMATO);
                break;
            case 'crate_lettuce':
                station = new Crate(this.gameWorld.scene, this.gameWorld.world, pos, IngredientType.LETTUCE);
                break;
            case 'crate_meat':
                station = new Crate(this.gameWorld.scene, this.gameWorld.world, pos, IngredientType.MEAT);
                break;
            case 'chopping_board':
                station = new ChoppingBoard(this.gameWorld.scene, this.gameWorld.world, pos);
                break;
            case 'stove':
                station = new Stove(this.gameWorld.scene, this.gameWorld.world, pos);
                break;
            case 'plate_dispenser':
                station = new PlateDispenser(this.gameWorld.scene, this.gameWorld.world, pos);
                break;
            case 'counter':
                station = new Counter(this.gameWorld.scene, this.gameWorld.world, pos);
                break;
            case 'delivery':
                station = new DeliveryStation(this.gameWorld.scene, this.gameWorld.world, pos, this.gameWorld.orderManager);
                break;
        }

        if (station) {
            // Assign deterministic ID
            station.id = `${type}_${x}_${z}`;

            this.gameWorld.stations.push(station);
            this.gameWorld.world.interactables.push(station.mesh);

            // Store type for serialization
            station.typeId = type;
        }
    }

    serializeLevel() {
        const stationsData = this.gameWorld.stations.map(s => ({
            type: s.typeId || 'unknown',
            x: s.mesh.position.x,
            z: s.mesh.position.z,
            properties: {}
        }));

        return {
            stations: stationsData
        };
    }
}
