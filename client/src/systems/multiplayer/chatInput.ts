import { InputManager } from "../inputManager";

export class ChatInput {
  private chatOverlay!: HTMLDivElement;
  private chatInput!: HTMLInputElement;
  private isOpen = false;
  private onSendMessage?: (message: string) => void;

  constructor() {
    this.createChatOverlay();
    this.setupEventListeners();
  }

  private createChatOverlay(): void {
    this.chatOverlay = document.createElement("div");
    this.chatOverlay.className = "chat-overlay";
    this.chatOverlay.style.display = "none";

    const chatBox = document.createElement("div");
    chatBox.className = "chat-box";

    const chatLabel = document.createElement("div");
    chatLabel.className = "chat-label";
    chatLabel.textContent = "Press Enter to send, Escape to cancel";

    this.chatInput = document.createElement("input");
    this.chatInput.type = "text";
    this.chatInput.className = "chat-input";
    this.chatInput.placeholder = "Type your message...";
    this.chatInput.maxLength = 100;

    const sendButton = document.createElement("button");
    sendButton.className = "chat-send-button";
    sendButton.textContent = "Send";
    sendButton.type = "button";

    sendButton.addEventListener("click", () => {
      this.sendMessage();
    });

    chatBox.appendChild(chatLabel);
    chatBox.appendChild(this.chatInput);
    chatBox.appendChild(sendButton);
    this.chatOverlay.appendChild(chatBox);
    document.body.appendChild(this.chatOverlay);
  }

  private setupEventListeners(): void {
    const inputManager = InputManager.getInstance();
    inputManager.bindActionRelease("chat", this.handleChatRelease);

    // Chat input listeners
    this.chatInput.addEventListener("keydown", (event) => {
      // Prevent game controls while typing
      event.stopPropagation();

      if (event.key === "Enter") {
        event.preventDefault();
        this.sendMessage();
      } else if (event.key === "Escape") {
        event.preventDefault();
        this.closeChat();
      }
    });

    // Close chat when clicking outside
    this.chatOverlay.addEventListener("click", (event) => {
      if (event.target === this.chatOverlay) {
        this.closeChat();
      }
    });
  }

  private handleChatRelease(): void {
    if (!this.isOpen) {
      this.openChat();
    }
  }

  public openChat(): void {
    if (this.isOpen) return;

    this.isOpen = true;
    this.chatOverlay.style.display = "flex";
    this.chatInput.value = "";
    this.chatInput.focus();
  }

  public closeChat(): void {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.chatOverlay.style.display = "none";
    this.chatInput.blur();
  }

  private sendMessage(): void {
    const message = this.chatInput.value.trim();
    if (message && this.onSendMessage) {
      this.onSendMessage(message);
    }
    this.closeChat();
  }

  public onSend(callback: (message: string) => void): void {
    this.onSendMessage = callback;
  }

  public isInputOpen(): boolean {
    return this.isOpen;
  }

  public cleanup(): void {
    const inputManager = InputManager.getInstance();
    inputManager.unbindActionRelease("chat", this.handleChatRelease);

    if (this.chatOverlay && this.chatOverlay.parentNode) {
      this.chatOverlay.parentNode.removeChild(this.chatOverlay);
    }
  }
}
