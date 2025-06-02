import nipplejs, { EventData, JoystickManager } from "nipplejs";
import { Main } from "../main";

export interface JoystickState {
  x: number; // -1 to 1
  y: number; // -1 to 1
  active: boolean;
}

export class MobileControls {
  private joystickManager!: JoystickManager;
  private fishButton!: HTMLButtonElement;
  private chatButton!: HTMLButtonElement;
  private joystickState: JoystickState = { x: 0, y: 0, active: false };

  // Callbacks for input events
  public onJoystickChange?: (state: JoystickState) => void;
  public onFishButtonPress?: () => void;
  public onFishButtonRelease?: () => void;
  public onChatButtonPress?: () => void;
  public onChatButtonRelease?: () => void;

  constructor() {
    this.createMobileUI();
    this.setupEventListeners();
  }

  private createMobileUI() {
    // Only show on mobile/touch devices
    if (!this.isMobileDevice()) {
      return;
    }

    // Create a specific zone for the joystick
    const joystickZone = document.createElement("div");
    joystickZone.className = "joystick-zone";
    document.body.appendChild(joystickZone);

    // Create joystick using the specific zone
    this.joystickManager = nipplejs.create({
      zone: joystickZone,
      mode: "static",
      position: { left: "50%", bottom: "50%" },
      color: "blue",
      size: 100,
      restOpacity: 0.7
    });

    // Fish button
    this.fishButton = document.createElement("button");
    this.fishButton.className = "mobile-button mobile-fish-button";
    document.body.appendChild(this.fishButton);

    // Chat button
    this.chatButton = document.createElement("button");
    this.chatButton.className = "mobile-button mobile-chat-button";
    document.body.appendChild(this.chatButton);

    if (!Main.getInstance().isMultiplayer()) {
      this.chatButton.className += " hidden";
    }
  }

  private setupEventListeners() {
    if (!this.isMobileDevice()) return;

    // Joystick events
    this.joystickManager.on("start", () => {
      this.joystickState.active = true;
    });

    this.joystickManager.on("move", (_: EventData, data: any) => {
      if (data.vector) {
        // nipplejs provides vector with x and y from -1 to 1
        this.joystickState.x = data.vector.x;
        this.joystickState.y = -data.vector.y; // Invert Y to match our coordinate system
        this.onJoystickChange?.(this.joystickState);
      }
    });

    this.joystickManager.on("end", () => {
      this.joystickState = { x: 0, y: 0, active: false };
      this.onJoystickChange?.(this.joystickState);
    });

    // Fish button events
    this.fishButton.addEventListener("mousedown", () => {
      this.onFishButtonPress?.();
    });

    this.fishButton.addEventListener("mouseup", () => {
      this.onFishButtonRelease?.();
    });

    this.fishButton.addEventListener("click", (e) => {
      e.preventDefault();
    });

    // Chat button events
    this.chatButton.addEventListener("mousedown", () => {
      this.onChatButtonPress?.();
    });

    this.chatButton.addEventListener("mouseup", () => {
      this.onChatButtonRelease?.();
    });

    this.chatButton.addEventListener("click", (e) => {
      e.preventDefault();
    });
  }

  private isMobileDevice(): boolean {
    console.log(navigator.userAgent);
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      "ontouchstart" in window
    );
  }

  public getJoystickState(): JoystickState {
    return { ...this.joystickState };
  }

  public destroy() {
    if (this.joystickManager) {
      this.joystickManager.destroy();
    }
    if (this.fishButton) {
      this.fishButton.remove();
    }
    if (this.chatButton) {
      this.chatButton.remove();
    }
    // Clean up the joystick zone
    const joystickZone = document.querySelector(".joystick-zone");
    if (joystickZone) {
      joystickZone.remove();
    }
  }
}
