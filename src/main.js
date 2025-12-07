import { GameWorld } from './game/GameWorld.js';
import { MultiplayerManager } from './client/MultiplayerManager.js';

const container = document.body;
const gameWorld = new GameWorld(container);
const multiplayerManager = new MultiplayerManager(gameWorld);

function animate(time) {
    requestAnimationFrame(animate);
    gameWorld.update(time);
}

requestAnimationFrame(animate);
