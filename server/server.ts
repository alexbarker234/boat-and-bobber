import { Server } from "colyseus";
import { GameRoom } from "./rooms/GameRoom";

const port = parseInt(process.env.PORT || "3000", 10);

const gameServer = new Server();
gameServer.define("game", GameRoom);
gameServer.listen(port);

console.log(`[GameServer] Listening on Port: ${port}`);
