import nipplejs, { EventData, JoystickManager } from "nipplejs";
import { Main } from "../main";
import { InputManager } from "./inputManager";

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
  private inputManager: InputManager;

  // Movement state for joystick
  private movementStates = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  constructor(inputManager: InputManager) {
    this.inputManager = inputManager;
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

    // Bind buttons to actions through the input manager
    this.inputManager.bindButtonToAction(this.fishButton, "fish");
    this.inputManager.bindButtonToAction(this.chatButton, "chat");
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
        this.joystickState.y = data.vector.y;
        this.updateMovementFromJoystick();
      }
    });

    this.joystickManager.on("end", () => {
      this.joystickState = { x: 0, y: 0, active: false };
      this.updateMovementFromJoystick();
    });
  }

  private updateMovementFromJoystick() {
    const threshold = 0.3;

    // Calculate new movement states
    const newStates = {
      forward: this.joystickState.active && this.joystickState.y > threshold,
      backward: this.joystickState.active && this.joystickState.y < -threshold,
      left: this.joystickState.active && this.joystickState.x < -threshold,
      right: this.joystickState.active && this.joystickState.x > threshold
    };

    // Handle state changes by simulating key presses/releases
    Object.entries(newStates).forEach(([direction, isActive]) => {
      const wasActive = this.movementStates[direction as keyof typeof this.movementStates];

      if (isActive && !wasActive) {
        // Start pressing
        this.inputManager.simulateKeyPress(this.inputManager.getKeyForAction(direction as any) || "");
      } else if (!isActive && wasActive) {
        // Stop pressing
        this.inputManager.simulateKeyRelease(this.inputManager.getKeyForAction(direction as any) || "");
      }
    });

    // Update our internal state
    this.movementStates = newStates;
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
    // Release any active movement states
    Object.entries(this.movementStates).forEach(([direction, isActive]) => {
      if (isActive) {
        this.inputManager.simulateKeyRelease(this.inputManager.getKeyForAction(direction as any) || "");
      }
    });

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
