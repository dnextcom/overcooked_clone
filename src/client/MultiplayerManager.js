// src/client/MultiplayerManager.js
// Manages multiplayer client-side integration
import { ClientNetwork } from "./ClientNetwork.js";
import { GameWorld } from "../game/GameWorld.js";

export class MultiplayerManager {
    /**
     * @param {GameWorld} gameWorld - The local game world instance
     * @param {string} serverUrl - URL of the multiplayer server (default localhost:3001)
     */
    constructor(gameWorld, serverUrl = "http://localhost:3001") {
        this.gameWorld = gameWorld;
        this.network = new ClientNetwork(serverUrl);
        this.network.setStateSyncHandler(this.handleStateSync.bind(this));
        this.network.setInteractionHandler(this.handleInteractionEvent.bind(this));
        this.network.setStationUpdateHandler(this.handleStationUpdate.bind(this));

        // Disable local order spawning
        if (this.gameWorld.orderManager) {
            this.gameWorld.orderManager.disableSpawning = true;
        }

        this.lastInput = {};
        this.lastSendTime = 0;
        this.sendInterval = 100; // ms
        this.setupActionForwarding();
        this.setupActionForwarding();
        this.setupOrderManagerForwarding();

        // Send initial player info (colors)
        setTimeout(() => this.sendPlayerInfo(), 100);
    }

    sendPlayerInfo() {
        if (this.gameWorld.player && this.gameWorld.player.colors) {
            this.sendAction({
                type: "playerInfo",
                data: { colors: this.gameWorld.player.colors }
            });
        }
    }

    // Forward local player actions to the server, throttled and only on change
    setupActionForwarding() {
        const player = this.gameWorld.player;
        if (!player) return;
        const originalUpdate = player.update.bind(player);
        const self = this;
        player.update = function (time) {
            originalUpdate(time); // Run physics first to get new pos

            const now = Date.now();
            const pos = player.body.position;
            // Simple threshold to avoid spamming stationary updates
            const lastPos = self.lastPos || { x: 0, z: 0 };
            const distSq = (pos.x - lastPos.x) ** 2 + (pos.z - lastPos.z) ** 2;

            const newItem = player.heldItem ? player.heldItem.name : null;
            const heldItemChanged = newItem !== self.lastHeldItem;

            if ((distSq > 0.001 || heldItemChanged) && now - self.lastSendTime >= self.sendInterval) {
                // Send absolute position with held item
                self.sendAction({
                    type: "position",
                    data: { x: pos.x, y: pos.y, z: pos.z, heldItem: newItem }
                });
                self.lastPos = { x: pos.x, z: pos.z };
                self.lastHeldItem = newItem;
                self.lastSendTime = now;
            }
        };

        // Hook interaction
        const originalInteract = player.tryInteract.bind(player);
        player.tryInteract = function () {
            // Predict local interact
            const station = player.getInteractTarget();
            originalInteract();

            if (station && station.id) {
                // Send reliable interaction action
                self.sendAction({
                    type: "interact",
                    data: { stationId: station.id }
                });

                // Also schedule a state update check?
                // Or let the station methods notify us? 
                // For minimally invasive code, we can poll/diff explicitly after interaction
                // But interaction might be async (animation?) 
                // Actually, let's just send the state immediately after the local interaction *simulation*.

                // Wait a tick for local logic to resolve (e.g. dropItem)
                setTimeout(() => {
                    self.sendStationUpdate(station);

                    // Force immediate position update to clear held item on server
                    // This prevents "ghost items" when stateSync arrives before next position update
                    const pos = player.body.position;
                    const newItem = player.heldItem ? player.heldItem.name : null;
                    self.sendAction({
                        type: "position",
                        data: { x: pos.x, y: pos.y, z: pos.z, heldItem: newItem }
                    });
                    self.lastHeldItem = newItem; // Update tracker
                }, 0);
            }
        }

        // Hook work action (chopping)
        const originalWork = player.tryWork.bind(player);
        player.tryWork = function () {
            const station = player.getInteractTarget();
            originalWork();
            if (station && station.id) {
                // Send work action
                self.sendAction({
                    type: "work",
                    data: { stationId: station.id }
                });
                setTimeout(() => {
                    self.sendStationUpdate(station);
                }, 0);
            }
        }
    }

    sendStationUpdate(station) {
        // Construct lightweight state
        const state = {
            heldItem: station.heldItem ? {
                type: station.heldItem.type,
                // Add specific props like 'ingredients' for plates
                ingredients: station.heldItem.ingredients || []
            } : null,
            progress: station.progress || 0
        };

        this.sendAction({
            type: "stationUpdate",
            data: {
                id: station.id,
                state: state
            }
        });
    }

    handleStationUpdate(data) {
        // data: { id, state }
        const station = this.gameWorld.stations.find(s => s.id === data.id);
        if (!station) return;

        // Sync progress
        if (data.state.progress !== undefined) station.progress = data.state.progress;

        // Sync held item
        // If data says null, remove item
        if (!data.state.heldItem) {
            if (station.heldItem) {
                station.heldItem.destroy();
                station.heldItem = null;
            }
        } else {
            // Check if matches existing
            if (station.heldItem && station.heldItem.type === data.state.heldItem.type) {
                // Just update props (like plate ingredients)
                if (station.heldItem.syncIngredients) {
                    station.heldItem.syncIngredients(data.state.heldItem.ingredients);
                }
            } else {
                // Force replace
                if (station.heldItem) station.heldItem.destroy();

                // Need to spawn new item attached to station
                // We need access to Ingredient/LevelManager/GameWorld factories?
                // Station doesn't have easy spawn method. 
                // Hack: use a global factory helper or expose `spawnStationItem`

                // For now, assume GameWorld is available via `this.gameWorld`
                // We can use a method on GameWorld to "spawn item at station"
                this.gameWorld.forceStationItem(station, data.state.heldItem.type, data.state.heldItem.ingredients);
            }
        }
    }

    sendAction(action) {
        this.network.sendAction(action);
    }

    // Called when server broadcasts the authoritative state
    handleStateSync(state) {
        // Update remote players positions
        if (!state.players) return;
        Object.entries(state.players).forEach(([id, pdata]) => {
            // Skip local player (its id matches socket.id on client side)
            if (id === this.network.socket.id) return;
            this.gameWorld.updateRemotePlayer(id, pdata);
        });

        // Sync stations if state has them (future proofing)
        // if (state.stations) ...

        // Sync Global Score (Server authoritative?)
        // Currently Server.js only stores minimal state. 
        // We need to UPDATE server with score if we deliver locally.

        if (state.score !== undefined && this.gameWorld.orderManager) {
            this.gameWorld.orderManager.score = state.score;
        }

        // Sync Timer
        if (state.gameTime !== undefined) {
            this.gameWorld.gameTime = state.gameTime;
        }

        // Sync Orders
        // Override local orders with server orders
        if (state.orders && this.gameWorld.orderManager) {
            // For strict sync, replace list
            this.gameWorld.orderManager.orders = state.orders;
        }
    }

    setupOrderManagerForwarding() {
        const om = this.gameWorld.orderManager;
        const originalDeliver = om.deliverPlate.bind(om);
        const self = this;

        om.deliverPlate = function (items) {
            const result = originalDeliver(items);
            if (result && result.success) {
                // Send order complete action
                self.sendAction({
                    type: "orderComplete",
                    data: { orderId: result.orderId, score: result.score }
                });
            }
            return result;
        }
    }

    // Sync Orders?
    // Ideally orders are generated on server.
    // For MVP, if we generate locally, we desync.
    // Let's rely on event Broadcasting for "Order Complete" to update score on all clients.

    handleInteractionEvent(event) {
        // { playerId, stationId }
        // Find player and station
        const station = this.gameWorld.stations.find(s => s.id === event.stationId);
        if (!station) return;

        let actor = null;
        if (event.playerId === this.network.socket.id) {
            // It's me! But I already ran it locally. 
            // Optional: Re-run for correction? No, keep it smooth.
            return;
        } else {
            actor = this.gameWorld.remotePlayers.get(event.playerId);
        }

        if (actor && station) {
            console.log(`Replicating interaction: ${event.playerId} on ${event.stationId}`);
            station.interact(actor);
        }
    }
}
