import nipplejs, { EventData, JoystickManager } from "nipplejs";

export interface JoystickState {
  x: number; // -1 to 1
  y: number; // -1 to 1
  active: boolean;
}

export class MobileControls {
  private joystickManager!: JoystickManager;
  private fishButton!: HTMLDivElement;
  private joystickState: JoystickState = { x: 0, y: 0, active: false };

  // Callbacks for input events
  public onJoystickChange?: (state: JoystickState) => void;
  public onFishButtonPress?: () => void;
  public onFishButtonRelease?: () => void;

  constructor() {
    this.createMobileUI();
    this.setupEventListeners();
  }

  private createMobileUI() {
    // Only show on mobile/touch devices
    if (!this.isMobileDevice()) {
      return;
    }

    // Create joystick using nipplejs
    this.joystickManager = nipplejs.create({
      zone: document.body,
      mode: "static",
      position: { left: "80px", bottom: "80px" },
      color: "blue",
      size: 120,
      restOpacity: 0.7
    });

    // Fish button
    this.fishButton = document.createElement("div");
    this.fishButton.className = "mobile-fish-button";
    this.fishButton.innerHTML = "🎣";
    document.body.appendChild(this.fishButton);
  }

  private setupEventListeners() {
    if (!this.isMobileDevice()) return;

    // Joystick events
    this.joystickManager.on("start", (evt: EventData, data: any) => {
      this.joystickState.active = true;
    });

    this.joystickManager.on("move", (evt: EventData, data: any) => {
      if (data.vector) {
        // nipplejs provides vector with x and y from -1 to 1
        this.joystickState.x = data.vector.x;
        this.joystickState.y = -data.vector.y; // Invert Y to match our coordinate system
        this.onJoystickChange?.(this.joystickState);
      }
    });

    this.joystickManager.on("end", (evt: EventData, data: any) => {
      this.joystickState = { x: 0, y: 0, active: false };
      this.onJoystickChange?.(this.joystickState);
    });

    // Fish button events
    this.fishButton.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        this.fishButton.classList.add("pressed");
        this.onFishButtonPress?.();
      },
      { passive: false }
    );

    this.fishButton.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        this.fishButton.classList.remove("pressed");
        this.onFishButtonRelease?.();
      },
      { passive: false }
    );
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
  }
}
