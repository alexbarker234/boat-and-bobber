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
        player.quaternionX = message.rotation.x;
        player.quaternionY = message.rotation.y;
        player.quaternionZ = message.rotation.z;
        player.quaternionW = message.rotation.w;
      }
    });
  }

  onJoin(client: Client, options: any) {
    console.log(`Player ${client.sessionId} joined!`);

    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name;
    player.color = options.color;
    player.x = 0;
    player.y = 5;
    player.z = 10;
    player.quaternionX = 0;
    player.quaternionY = 0;
    player.quaternionZ = 0;
    player.quaternionW = 1;
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
