import { Client, Room } from "colyseus";
import { GameState } from "../schema/GameState";
import { Player } from "../schema/Player";

export class GameRoom extends Room<GameState> {
  maxClients = 50;

  onCreate(options: any) {
    this.state = new GameState();

    console.log("GameRoom created!");

    this.onMessage("playerUpdate", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = message.position.x;
        player.y = message.position.y;
        player.z = message.position.z;
        player.rotationX = message.rotation.x;
        player.rotationY = message.rotation.y;
      }
    });
  }

  onJoin(client: Client, options: any) {
    console.log(`Player ${client.sessionId} joined!`);

    const player = new Player();
    player.id = client.sessionId;
    player.x = 0;
    player.y = 5;
    player.z = 10;
    player.rotationX = 0;
    player.rotationY = 0;
    player.connected = true;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Player ${client.sessionId} left!`);

    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("GameRoom disposed!");
  }
}
