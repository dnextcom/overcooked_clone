import { GameWorld } from './game/GameWorld.js';

const container = document.body;
const gameWorld = new GameWorld(container);

function animate(time) {
    requestAnimationFrame(animate);
    gameWorld.update(time);
}

requestAnimationFrame(animate);
