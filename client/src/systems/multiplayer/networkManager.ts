import { Client, getStateCallbacks, Room } from "colyseus.js";
import * as THREE from "three";
import type { GameState } from "../../../../server/schema/GameState";
import type { PlayerUpdateMessage } from "../../types/types";
import { AssetLoader } from "../assetLoader";
import { SaveManager } from "../saveManager";
import { ChatInput } from "./chatInput";
import { PlayerUI } from "./playerUI";

interface OtherPlayer {
  mesh: THREE.Mesh;
  nameElement: HTMLDivElement;
  lastPosition: THREE.Vector3;
  desiredPosition: THREE.Vector3;
  lastRotation: { x: number; y: number; z: number; w: number };
  desiredRotation: { x: number; y: number; z: number; w: number };
}

export class NetworkManager {
  private client = new Client("ws://localhost:3000");
  private room?: Room<GameState>;
  private otherPlayers = new Map<string, OtherPlayer>();
  private lastNetworkUpdate = 0;
  private networkUpdateRate = 1000 / 20; // 20 updates per second

  // Player representation geometry
  private playerGeometry: THREE.BufferGeometry<THREE.NormalBufferAttributes>;
  private playerUI: PlayerUI;
  private chatInput: ChatInput;

  constructor(
    private scene: THREE.Scene,
    // why are these things complaining, they literally get used 2 lines down
    // @ts-ignore
    private camera: THREE.Camera,
    // @ts-ignore
    private renderer: THREE.WebGLRenderer
  ) {
    const geometry = AssetLoader.getInstance().getAsset("benchy");
    this.playerUI = new PlayerUI(camera, renderer);
    this.chatInput = new ChatInput();

    if (!geometry) throw new Error("Boat model not loaded!");

    this.playerGeometry = geometry;
    this.setupChatInput();
  }

  private setupChatInput(): void {
    this.chatInput.onSend((message: string) => {
      this.sendChatMessage(message);
    });
  }

  public async connect(): Promise<void> {
    try {
      const saveManager = SaveManager.getInstance();
      const playerSettings = saveManager.loadPlayerSettings() || saveManager.getDefaultPlayerSettings();

      this.room = await this.client.joinOrCreate("game", {
        name: playerSettings.name,
        color: `#${playerSettings.boatColor.getHexString()}`
      });
      console.log("Connected to server!");
      this.setupPlayerListeners();
    } catch (error) {
      console.error("Failed to connect to server:", error);
      // Retry connection after a delay
      setTimeout(() => {
        console.log("Retrying connection...");
        this.connect();
      }, 3000);
    }
  }

  private setupPlayerListeners() {
    if (!this.room) return;

    console.log("Setting up player listeners");
    const $ = getStateCallbacks(this.room);

    this.room.onMessage("chatMessage", (data: { playerId: string; message: string }) => {
      console.log("Received chat message:", data);
      this.playerUI.addChatMessage(data.playerId, data.message);
    });

    $(this.room.state).players.onAdd((player, sessionId) => {
      console.log("Player joined:", sessionId);

      // Don't create a visual representation for our own player
      if (sessionId === this.room!.sessionId) return;

      // Create visual representation for other players
      const material = new THREE.MeshToonMaterial({ color: player.color });
      const playerMesh = new THREE.Mesh(this.playerGeometry, material);
      playerMesh.position.set(player.x, player.y, player.z);
      playerMesh.scale.set(0.02, 0.02, 0.02);
      playerMesh.castShadow = true;
      playerMesh.receiveShadow = true;
      this.scene.add(playerMesh);

      const nameElement = this.playerUI.createNameElement(sessionId, player.name);

      const otherPlayer: OtherPlayer = {
        mesh: playerMesh,
        nameElement: nameElement,
        lastPosition: new THREE.Vector3(player.x, player.y, player.z),
        desiredPosition: new THREE.Vector3(player.x, player.y, player.z),
        lastRotation: { x: player.quaternionX, y: player.quaternionY, z: player.quaternionZ, w: player.quaternionW },
        desiredRotation: { x: player.quaternionX, y: player.quaternionY, z: player.quaternionZ, w: player.quaternionW }
      };

      this.otherPlayers.set(sessionId, otherPlayer);

      $(player).onChange(() => {
        console.log("Player changed:", sessionId);
        if (sessionId === this.room!.sessionId) return;

        const otherPlayer = this.otherPlayers.get(sessionId);
        if (otherPlayer) {
          // Update last position to current position before setting new desired position
          otherPlayer.lastPosition.copy(otherPlayer.mesh.position);
          otherPlayer.lastRotation = { ...otherPlayer.desiredRotation };

          // Set new desired position and rotation
          otherPlayer.desiredPosition.set(player.x, player.y, player.z);
          otherPlayer.desiredRotation = {
            x: player.quaternionX,
            y: player.quaternionY,
            z: player.quaternionZ,
            w: player.quaternionW
          };
        }
      });
    });

    $(this.room.state).players.onRemove((_, sessionId) => {
      console.log("Player left:", sessionId);

      const otherPlayer = this.otherPlayers.get(sessionId);
      if (otherPlayer) {
        this.scene.remove(otherPlayer.mesh);
        this.playerUI.removeNameElement(sessionId);
        this.otherPlayers.delete(sessionId);
      }
    });
  }

  public update(deltaTime: number) {
    // Interpolate positions and rotations for all other players
    const interpolationSpeed = 20;

    this.otherPlayers.forEach((otherPlayer) => {
      // Interpolate position
      otherPlayer.mesh.position.lerp(otherPlayer.desiredPosition, interpolationSpeed * deltaTime);

      // Interpolate rotation using slerp
      const rotationSlerpFactor = interpolationSpeed * deltaTime;

      const currentQuaternion = new THREE.Quaternion();
      currentQuaternion.setFromEuler(otherPlayer.mesh.rotation);

      const desiredQuaternion = new THREE.Quaternion();
      desiredQuaternion.set(
        otherPlayer.desiredRotation.x,
        otherPlayer.desiredRotation.y,
        otherPlayer.desiredRotation.z,
        otherPlayer.desiredRotation.w
      );

      currentQuaternion.slerp(desiredQuaternion, rotationSlerpFactor);

      otherPlayer.mesh.setRotationFromQuaternion(currentQuaternion);
    });

    // Update name positions for all players
    this.otherPlayers.forEach((otherPlayer) => {
      this.playerUI.updateNamePosition(otherPlayer.nameElement, otherPlayer.mesh.position);
    });

    // Update chat positions
    this.playerUI.updateChatPositions();
  }

  public sendPlayerUpdate(position: THREE.Vector3, quaternion: THREE.Quaternion, currentTime: number) {
    if (!this.room || !this.room.state) return;
    // Send network updates at a lower rate
    if (currentTime - this.lastNetworkUpdate > this.networkUpdateRate) {
      const message: PlayerUpdateMessage = {
        position: {
          x: position.x,
          y: position.y,
          z: position.z
        },
        rotation: {
          x: quaternion.x,
          y: quaternion.y,
          z: quaternion.z,
          w: quaternion.w
        }
      };

      this.room.send("playerUpdate", message);
      this.lastNetworkUpdate = currentTime;
    }
  }

  public sendChatMessage(message: string): void {
    if (!this.room) return;
    this.room.send("chatMessage", { message });

    // Show our own message immediately
    this.playerUI.addChatMessage(this.room.sessionId, message);
  }

  public isChatOpen(): boolean {
    return this.chatInput.isInputOpen();
  }

  public cleanup() {
    this.playerUI.cleanup();
    this.chatInput.cleanup();
  }
}
