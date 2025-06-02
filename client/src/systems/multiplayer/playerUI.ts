import * as THREE from "three";

interface ChatMessage {
  id: string;
  text: string;
  timestamp: number;
  element: HTMLDivElement;
}

interface PlayerUIContainer {
  container: HTMLDivElement;
  nameElement?: HTMLDivElement;
  chatMessages: ChatMessage[];
}

export class PlayerUI {
  private uiContainer!: HTMLDivElement;
  private playerUIs = new Map<string, PlayerUIContainer>();
  private localPlayerId?: string;
  private localPlayerPosition?: THREE.Vector3;

  // Distance scaling constants
  private readonly MIN_SCALE = 0.5;
  private readonly MAX_SCALE = 1.0;
  private readonly MAX_DISTANCE = 20;
  private readonly FADE_DISTANCE = 10;

  // Chat constants
  private readonly CHAT_FADE_START = 3000;
  private readonly CHAT_FADE_DURATION = 2000;
  private readonly CHAT_OFFSET_Y = 30; // pixels between chat messages

  constructor(
    private camera: THREE.Camera,
    private renderer: THREE.WebGLRenderer
  ) {
    this.setupUIContainer();
  }

  private setupUIContainer() {
    this.uiContainer = document.createElement("div");
    this.uiContainer.className = "player-ui-container";
    document.body.appendChild(this.uiContainer);
  }

  public setLocalPlayerId(playerId: string): void {
    this.localPlayerId = playerId;
  }

  public setLocalPlayerPosition(position: THREE.Vector3): void {
    this.localPlayerPosition = position.clone();
  }

  private createPlayerUIContainer(playerId: string): PlayerUIContainer {
    const container = document.createElement("div");
    container.className = "player-ui";
    this.uiContainer.appendChild(container);

    const playerUI: PlayerUIContainer = {
      container,
      chatMessages: []
    };

    this.playerUIs.set(playerId, playerUI);
    return playerUI;
  }

  public createNameElement(playerId: string, playerName: string): HTMLDivElement {
    let playerUI = this.playerUIs.get(playerId);
    if (!playerUI) {
      playerUI = this.createPlayerUIContainer(playerId);
    }

    const nameElement = document.createElement("div");
    nameElement.textContent = playerName;
    nameElement.className = "player-name";
    playerUI.container.appendChild(nameElement);
    playerUI.nameElement = nameElement;

    return nameElement;
  }

  public removeNameElement(playerId: string): void {
    const playerUI = this.playerUIs.get(playerId);
    if (playerUI) {
      if (this.uiContainer.contains(playerUI.container)) {
        this.uiContainer.removeChild(playerUI.container);
      }
      this.playerUIs.delete(playerId);
    }
  }

  public addChatMessage(playerId: string, message: string): void {
    let playerUI = this.playerUIs.get(playerId);
    if (!playerUI) {
      playerUI = this.createPlayerUIContainer(playerId);
    }

    // Create chat element
    const chatElement = document.createElement("div");
    chatElement.textContent = message;
    chatElement.className = "player-chat";
    playerUI.container.appendChild(chatElement);

    const chatMessage: ChatMessage = {
      id: `${playerId}-${Date.now()}`,
      text: message,
      timestamp: Date.now(),
      element: chatElement
    };

    playerUI.chatMessages.push(chatMessage);

    // Auto-remove after fade duration
    setTimeout(() => {
      this.removeChatMessage(playerId, chatMessage.id);
    }, this.CHAT_FADE_START + this.CHAT_FADE_DURATION);
  }

  private removeChatMessage(playerId: string, messageId: string): void {
    const playerUI = this.playerUIs.get(playerId);
    if (!playerUI) return;

    const messageIndex = playerUI.chatMessages.findIndex((chat) => chat.id === messageId);
    if (messageIndex === -1) return;

    const chatMessage = playerUI.chatMessages[messageIndex];
    if (playerUI.container.contains(chatMessage.element)) {
      playerUI.container.removeChild(chatMessage.element);
    }

    playerUI.chatMessages.splice(messageIndex, 1);
  }

  private calculatePlayerUIPosition(
    playerId: string,
    playerPosition?: THREE.Vector3
  ): { x: number; y: number; visible: boolean; scale: number; opacity: number } {
    let worldPosition: THREE.Vector3;

    // Determine world position based on player type
    if (playerId === this.localPlayerId) {
      if (!this.localPlayerPosition) {
        return { x: 0, y: 0, visible: false, scale: 1, opacity: 0 };
      }
      worldPosition = this.localPlayerPosition.clone();
    } else {
      if (!playerPosition) {
        return { x: 0, y: 0, visible: false, scale: 1, opacity: 0 };
      }
      worldPosition = playerPosition.clone();
    }

    // Add offset to position UI above player's head
    const uiOffset = new THREE.Vector3(0, 1, 0);
    worldPosition.add(uiOffset);

    // Project to screen space
    const screenPosition = worldPosition.clone().project(this.camera);

    const canvas = this.renderer.domElement;
    const x = (screenPosition.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (screenPosition.y * -0.5 + 0.5) * canvas.clientHeight;

    // Check visibility
    const isVisible =
      screenPosition.z < 1 && x >= -100 && x <= canvas.clientWidth + 100 && y >= -50 && y <= canvas.clientHeight + 50;

    if (!isVisible) {
      return { x, y, visible: false, scale: 1, opacity: 0 };
    }

    // Calculate scale and opacity based on distance (only for other players)
    let scale = 1;
    let opacity = 1;

    if (playerId !== this.localPlayerId && playerPosition) {
      const distance = this.camera.position.distanceTo(playerPosition);
      const normalizedDistance = Math.max(0, Math.min(1, distance / this.MAX_DISTANCE));
      scale = this.MAX_SCALE - normalizedDistance * (this.MAX_SCALE - this.MIN_SCALE);

      if (distance > this.FADE_DISTANCE) {
        const fadeRange = this.MAX_DISTANCE - this.FADE_DISTANCE;
        const fadeProgress = Math.min(1, (distance - this.FADE_DISTANCE) / fadeRange);
        opacity = 1 - fadeProgress;
      }
    }

    return { x, y, visible: true, scale, opacity };
  }

  public updateChatPositions(): void {
    this.updateAllPositions();
  }

  private updateAllPositions(): void {
    this.playerUIs.forEach((playerUI, playerId) => {
      // Get player position for other players
      let playerPosition: THREE.Vector3 | undefined;
      if (playerId !== this.localPlayerId) {
        // We need to get this from the NetworkManager - for now we'll skip positioning other players here
        // The NetworkManager will call updatePlayerPosition for each other player
        return;
      }

      const uiPosition = this.calculatePlayerUIPosition(playerId, playerPosition);

      if (!uiPosition.visible) {
        playerUI.container.style.display = "none";
        return;
      }

      // Position the container
      playerUI.container.style.left = `${uiPosition.x}px`;
      playerUI.container.style.top = `${uiPosition.y}px`;
      playerUI.container.style.transform = `translate(-50%, -100%) scale(${uiPosition.scale})`;
      playerUI.container.style.opacity = uiPosition.opacity.toString();
      playerUI.container.style.display = "block";

      // Update individual chat message positions within the container
      this.updateChatMessagesInContainer(playerUI);
    });
  }

  public updatePlayerPosition(playerId: string, playerPosition: THREE.Vector3): void {
    const playerUI = this.playerUIs.get(playerId);
    if (!playerUI) return;

    const uiPosition = this.calculatePlayerUIPosition(playerId, playerPosition);

    if (!uiPosition.visible) {
      playerUI.container.style.display = "none";
      return;
    }

    // Position the container
    playerUI.container.style.left = `${uiPosition.x}px`;
    playerUI.container.style.top = `${uiPosition.y}px`;
    playerUI.container.style.transform = `translate(-50%, -100%) scale(${uiPosition.scale})`;
    playerUI.container.style.opacity = uiPosition.opacity.toString();
    playerUI.container.style.display = "block";

    // Update individual chat message positions within the container
    this.updateChatMessagesInContainer(playerUI);
  }

  private updateChatMessagesInContainer(playerUI: PlayerUIContainer): void {
    // Position chat messages within the container, stacking upwards from the name
    let currentOffset = 0;

    // If there's a name element, start above it
    if (playerUI.nameElement) {
      currentOffset = -this.CHAT_OFFSET_Y - 10;
    }

    playerUI.chatMessages.forEach((chat, index) => {
      // Calculate fade based on age
      const age = Date.now() - chat.timestamp;
      let opacity = 1;
      if (age > this.CHAT_FADE_START) {
        const fadeProgress = Math.min(1, (age - this.CHAT_FADE_START) / this.CHAT_FADE_DURATION);
        opacity = 1 - fadeProgress;
      }

      // Position relative to container
      chat.element.style.position = "absolute";
      chat.element.style.left = "50%";
      chat.element.style.top = `${currentOffset - index * this.CHAT_OFFSET_Y}px`;
      chat.element.style.transform = "translate(-50%, -100%)";
      chat.element.style.opacity = opacity.toString();
      chat.element.style.display = "block";
    });
  }

  public cleanup(): void {
    if (this.uiContainer && this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
    }
    this.playerUIs.clear();
  }
}
