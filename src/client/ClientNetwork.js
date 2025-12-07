// src/client/ClientNetwork.js
// Simple client wrapper for Socket.io communication
import { io } from "socket.io-client/dist/socket.io.js";

export class ClientNetwork {
    constructor(serverUrl = "http://localhost:3001") {
        this.socket = io(serverUrl);
        this.socket.on("connect", () => {
            console.log("Connected to multiplayer server, id:", this.socket.id);
        });
        this.socket.on("stateSync", (state) => {
            if (this.onStateSync) {
                this.onStateSync(state);
            }
        });
    }

    // Send player action to server
    sendAction(action) {
        this.socket.emit("playerAction", action);
    }

    // Register callback for state synchronization
    setStateSyncHandler(callback) {
        this.onStateSync = callback;
    }

    setInteractionHandler(callback) {
        this.socket.on("interaction", (event) => {
            if (callback) callback(event);
        });
    }

    setStationUpdateHandler(callback) {
        this.socket.on("stationUpdate", (data) => {
            if (callback) callback(data);
        });
    }
}
