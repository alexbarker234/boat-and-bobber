import { Client, getStateCallbacks, Room } from "colyseus.js";
import * as THREE from "three";
import type { GameState } from "../../../server/schema/GameState";
import type { PlayerUpdateMessage } from "../types/types";
import { AssetLoader } from "./assetLoader";
import { SaveManager } from "./saveManager";

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
  private playerGeometry!: THREE.BufferGeometry<THREE.NormalBufferAttributes>;
  private nameContainer!: HTMLDivElement;

  // Distance scaling constants
  private readonly MIN_SCALE = 0.5;
  private readonly MAX_SCALE = 1.0;
  private readonly MAX_DISTANCE = 20;
  private readonly FADE_DISTANCE = 10;

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.Camera,
    private renderer: THREE.WebGLRenderer
  ) {
    const geometry = AssetLoader.getInstance().getAsset("benchy");
    if (!geometry) {
      console.error("Boat model not loaded!");
      return;
    }
    this.playerGeometry = geometry;
    this.setupNameContainer();
    this.loadStyles();
  }

  private loadStyles() {
    // Load the CSS file for player names
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/src/styles/playerNames.css";
    document.head.appendChild(link);
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

  private setupNameContainer() {
    // Create container for player names
    this.nameContainer = document.createElement("div");
    this.nameContainer.className = "player-name-container";
    document.body.appendChild(this.nameContainer);
  }

  private createNameElement(playerName: string): HTMLDivElement {
    const nameElement = document.createElement("div");
    nameElement.textContent = playerName;
    nameElement.className = "player-name";

    this.nameContainer.appendChild(nameElement);
    return nameElement;
  }
  private updateNamePosition(otherPlayer: OtherPlayer) {
    const nameOffset = new THREE.Vector3(0, 1, 0);
    const worldPosition = otherPlayer.mesh.position.clone().add(nameOffset);

    const distance = this.camera.position.distanceTo(otherPlayer.mesh.position);

    const screenPosition = worldPosition.clone().project(this.camera);

    const canvas = this.renderer.domElement;
    const x = (screenPosition.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (screenPosition.y * -0.5 + 0.5) * canvas.clientHeight;

    const isVisible =
      screenPosition.z < 1 && x >= -100 && x <= canvas.clientWidth + 100 && y >= -50 && y <= canvas.clientHeight + 50;

    if (isVisible) {
      const normalizedDistance = Math.max(0, Math.min(1, distance / this.MAX_DISTANCE));
      const scale = this.MAX_SCALE - normalizedDistance * (this.MAX_SCALE - this.MIN_SCALE);

      let opacity = 1;
      if (distance > this.FADE_DISTANCE) {
        const fadeRange = this.MAX_DISTANCE - this.FADE_DISTANCE;
        const fadeProgress = Math.min(1, (distance - this.FADE_DISTANCE) / fadeRange);
        opacity = 1 - fadeProgress;
      }

      otherPlayer.nameElement.style.left = `${x}px`;
      otherPlayer.nameElement.style.top = `${y}px`;
      otherPlayer.nameElement.style.transform = `translate(-50%, -100%) scale(${scale})`;
      otherPlayer.nameElement.style.opacity = opacity.toString();
      otherPlayer.nameElement.style.display = "block";
    } else {
      otherPlayer.nameElement.style.display = "none";
    }
  }

  private setupPlayerListeners() {
    if (!this.room) return;

    console.log("Setting up player listeners");
    const $ = getStateCallbacks(this.room);

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

      const nameElement = this.createNameElement(player.name);

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
        this.nameContainer.removeChild(otherPlayer.nameElement);
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
      this.updateNamePosition(otherPlayer);
    });
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

  public cleanup() {
    // Clean up name container when network manager is destroyed
    if (this.nameContainer && this.nameContainer.parentNode) {
      this.nameContainer.parentNode.removeChild(this.nameContainer);
    }
  }
}
