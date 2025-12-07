// src/server/Server.js
// Simple Socket.io server for Overcooked Clone multiplayer
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { GameWorld } from "../game/GameWorld.js"; // will be used for authoritative state (placeholder)

const httpServer = createServer();
const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" }
});

// Store connected players
const players = new Map(); // playerId -> socket

// Placeholder for shared game state (could be an instance of GameWorld on server)
let sharedState = {
    // minimal example: positions of players, orders, scores
    players: {},
    orders: [],
    scores: {}
};

io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);
    // Assign a new playerId (use socket.id for simplicity)
    const playerId = socket.id;
    players.set(playerId, socket);
    // Initialize player state in sharedState
    sharedState.players[playerId] = { position: { x: 0, y: 0, z: 0 } };
    sharedState.scores[playerId] = 0;

    // Notify all clients of new player list
    io.emit("stateSync", sharedState);

    // Receive player actions from client
    socket.on("playerAction", (action) => {
        // For now, just forward the action to the server's authoritative logic placeholder
        // In a real implementation you would update sharedState here
        // Example action: { type: "move", data: { x:1, y:0, z:0 } }
        if (action.type === "position" && action.data) {
            // Client is authoritative
            sharedState.players[playerId].position = {
                x: action.data.x,
                y: action.data.y,
                z: action.data.z,
                heldItem: action.data.heldItem
            };
        } else if (action.type === "interact") {
            // Broadcast interaction to all other clients
            io.emit("interaction", { playerId, stationId: action.data.stationId });
        } else if (action.type === "stationUpdate") {
            // Broadcast station state to all other clients
            socket.broadcast.emit("stationUpdate", action.data);
        } else if (action.type === "orderComplete") {
            // Idempotency check: Ensure order still exists
            const orderExists = sharedState.orders.some(o => o.id === action.data.orderId);

            if (orderExists) {
                // Update authoritative score
                sharedState.score = action.data.score;
                // Remove order from server state
                sharedState.orders = sharedState.orders.filter(o => o.id !== action.data.orderId);
            }
        } else if (action.type === "playerInfo") {
            // Store player info (colors)
            if (sharedState.players[playerId]) {
                sharedState.players[playerId].colors = action.data.colors;
            }
        }
        // Broadcast updated state
        io.emit("stateSync", sharedState);
    });


    socket.on("disconnect", () => {
        console.log(`Player disconnected: ${playerId}`);
        players.delete(playerId);
        delete sharedState.players[playerId];
        delete sharedState.scores[playerId];
        io.emit("stateSync", sharedState);
    });
});

// Server Loop for Timer and Orders
sharedState.gameTime = 120; // 2 minutes
let orderSpawnTimer = 0;
const ORDER_INTERVAL = 8;
const MAX_ORDERS = 5;

// Simple recipe types (must match client keys)
const RECIPES = ['Salad', 'Burger'];

setInterval(() => {
    if (players.size > 0 && sharedState.gameTime > 0) {
        sharedState.gameTime -= 1;

        // Manage Orders
        // 1. Update timers
        sharedState.orders.forEach(o => o.remainingTime -= 1);

        // 2. Remove expired
        sharedState.orders = sharedState.orders.filter(o => o.remainingTime > 0);
        // Note: Score penalty for expiry not implemented on server yet, but visual feedback works on client?
        // Client OrderManager handles expiry visual? No, client just draws list.
        // If client `update` runs (with disableSpawning), it handles visual expiry?
        // Wait, Client `this.orders` is overwritten by server. 
        // So client just renders the state. Correct.

        // 3. Spawn new
        orderSpawnTimer += 1;
        if (orderSpawnTimer >= ORDER_INTERVAL) {
            orderSpawnTimer = 0;
            if (sharedState.orders.length < MAX_ORDERS) {
                const randomType = RECIPES[Math.floor(Math.random() * RECIPES.length)];
                sharedState.orders.push({
                    id: Date.now() + Math.random(),
                    recipeType: randomType,
                    duration: 60,
                    remainingTime: 60
                });
            }
        }

        io.emit("stateSync", sharedState);
    }
}, 1000);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Multiplayer server listening on http://localhost:${PORT}`);
});
