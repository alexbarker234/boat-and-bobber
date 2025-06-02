import * as THREE from "three";

interface ChatMessage {
  id: string;
  text: string;
  timestamp: number;
  element: HTMLDivElement;
}

export class PlayerUI {
  private nameContainer!: HTMLDivElement;
  private chatContainer!: HTMLDivElement;
  private playerNames = new Map<string, HTMLDivElement>();
  private playerChats = new Map<string, ChatMessage[]>();

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
    this.setupNameContainer();
    this.setupChatContainer();
  }

  private setupNameContainer() {
    this.nameContainer = document.createElement("div");
    this.nameContainer.className = "player-name-container";
    document.body.appendChild(this.nameContainer);
  }

  private setupChatContainer() {
    this.chatContainer = document.createElement("div");
    this.chatContainer.className = "player-chat-container";
    document.body.appendChild(this.chatContainer);
  }

  public createNameElement(playerId: string, playerName: string): HTMLDivElement {
    const nameElement = document.createElement("div");
    nameElement.textContent = playerName;
    nameElement.className = "player-name";

    this.nameContainer.appendChild(nameElement);
    this.playerNames.set(playerId, nameElement);
    return nameElement;
  }

  public removeNameElement(playerId: string): void {
    const nameElement = this.playerNames.get(playerId);
    if (nameElement && this.nameContainer.contains(nameElement)) {
      this.nameContainer.removeChild(nameElement);
      this.playerNames.delete(playerId);
    }

    // Clean up chat messages for this player
    const chatMessages = this.playerChats.get(playerId);
    if (chatMessages) {
      chatMessages.forEach((chat) => {
        if (this.chatContainer.contains(chat.element)) {
          this.chatContainer.removeChild(chat.element);
        }
      });
      this.playerChats.delete(playerId);
    }
  }

  public addChatMessage(playerId: string, message: string): void {
    if (!this.playerChats.has(playerId)) {
      this.playerChats.set(playerId, []);
    }

    const chatMessages = this.playerChats.get(playerId)!;

    // Create chat element
    const chatElement = document.createElement("div");
    chatElement.textContent = message;
    chatElement.className = "player-chat";
    this.chatContainer.appendChild(chatElement);

    const chatMessage: ChatMessage = {
      id: `${playerId}-${Date.now()}`,
      text: message,
      timestamp: Date.now(),
      element: chatElement
    };

    chatMessages.push(chatMessage);

    // Auto-remove after fade duration
    setTimeout(() => {
      this.removeChatMessage(playerId, chatMessage.id);
    }, this.CHAT_FADE_START + this.CHAT_FADE_DURATION);
  }

  private removeChatMessage(playerId: string, messageId: string): void {
    const chatMessages = this.playerChats.get(playerId);
    if (!chatMessages) return;

    const messageIndex = chatMessages.findIndex((chat) => chat.id === messageId);
    if (messageIndex === -1) return;

    const chatMessage = chatMessages[messageIndex];
    if (this.chatContainer.contains(chatMessage.element)) {
      this.chatContainer.removeChild(chatMessage.element);
    }

    chatMessages.splice(messageIndex, 1);
  }

  public updateNamePosition(nameElement: HTMLDivElement, playerPosition: THREE.Vector3): void {
    const nameOffset = new THREE.Vector3(0, 1, 0);
    const worldPosition = playerPosition.clone().add(nameOffset);

    const distance = this.camera.position.distanceTo(playerPosition);

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

      nameElement.style.left = `${x}px`;
      nameElement.style.top = `${y}px`;
      nameElement.style.transform = `translate(-50%, -100%) scale(${scale})`;
      nameElement.style.opacity = opacity.toString();
      nameElement.style.display = "block";
    } else {
      nameElement.style.display = "none";
    }
  }

  public updateChatPositions(): void {
    this.playerChats.forEach((chatMessages, playerId) => {
      const nameElement = this.playerNames.get(playerId);
      if (!nameElement || nameElement.style.display === "none") {
        // Hide chat messages if name is not visible
        chatMessages.forEach((chat) => {
          chat.element.style.display = "none";
        });
        return;
      }

      // Get name element position
      const nameRect = nameElement.getBoundingClientRect();
      const nameX = nameRect.left + nameRect.width / 2;
      const nameY = nameRect.top;

      // Position chat messages above the name, stacking upwards
      chatMessages.forEach((chat, index) => {
        const chatY = nameY - (index + 1) * this.CHAT_OFFSET_Y;

        // Calculate fade based on age
        const age = Date.now() - chat.timestamp;
        let opacity = 1;
        if (age > this.CHAT_FADE_START) {
          const fadeProgress = Math.min(1, (age - this.CHAT_FADE_START) / this.CHAT_FADE_DURATION);
          opacity = 1 - fadeProgress;
        }
        console.log(opacity);

        chat.element.style.left = `${nameX}px`;
        chat.element.style.top = `${chatY}px`;
        chat.element.style.opacity = opacity.toString();
        chat.element.style.display = "block";
      });
    });
  }

  public cleanup(): void {
    if (this.nameContainer && this.nameContainer.parentNode) {
      this.nameContainer.parentNode.removeChild(this.nameContainer);
    }
    if (this.chatContainer && this.chatContainer.parentNode) {
      this.chatContainer.parentNode.removeChild(this.chatContainer);
    }
    this.playerNames.clear();
    this.playerChats.clear();
  }
}
