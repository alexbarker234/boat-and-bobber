import { JoystickState, MobileControls } from "./mobileControls";

export interface InputState {
  movement: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
  };
  actions: {
    fish: boolean;
    reset: boolean;
    chat: boolean;
  };
  joystick: {
    x: number;
    y: number;
    active: boolean;
  };
}

export interface InputCallbacks {
  onFishPress?: () => void;
  onFishRelease?: () => void;
  onResetPress?: () => void;
  onResetRelease?: () => void;
  onChatPress?: () => void;
  onChatRelease?: () => void;
}

export class InputManager {
  private static instance: InputManager;
  private inputState: InputState = {
    movement: {
      forward: false,
      backward: false,
      left: false,
      right: false
    },
    actions: {
      fish: false,
      reset: false,
      chat: false
    },
    joystick: {
      x: 0,
      y: 0,
      active: false
    }
  };
  private mobileControls: MobileControls;
  private callbacks: InputCallbacks = {};

  private constructor() {
    this.setupKeyboardControls();
    this.mobileControls = new MobileControls();
    this.setupMobileControls();
  }

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  private setupKeyboardControls() {
    window.addEventListener("keydown", (e) => {
      switch (e.key.toLowerCase()) {
        case "w":
          this.inputState.movement.forward = true;
          break;
        case "s":
          this.inputState.movement.backward = true;
          break;
        case "a":
          this.inputState.movement.left = true;
          break;
        case "d":
          this.inputState.movement.right = true;
          break;
        case "f":
          if (!this.inputState.actions.fish) {
            this.inputState.actions.fish = true;
            this.callbacks.onFishPress?.();
          }
          break;
        case "r":
          if (!this.inputState.actions.reset) {
            this.inputState.actions.reset = true;
            this.callbacks.onResetPress?.();
          }
          break;
        case "t":
          if (!this.inputState.actions.chat) {
            this.inputState.actions.chat = true;
            this.callbacks.onChatPress?.();
          }
          break;
      }
    });

    window.addEventListener("keyup", (e) => {
      switch (e.key.toLowerCase()) {
        case "w":
          this.inputState.movement.forward = false;
          break;
        case "s":
          this.inputState.movement.backward = false;
          break;
        case "a":
          this.inputState.movement.left = false;
          break;
        case "d":
          this.inputState.movement.right = false;
          break;
        case "f":
          if (this.inputState.actions.fish) {
            this.inputState.actions.fish = false;
            this.callbacks.onFishRelease?.();
          }
          break;
        case "r":
          if (this.inputState.actions.reset) {
            this.inputState.actions.reset = false;
            this.callbacks.onResetRelease?.();
          }
          break;
        case "t":
          if (this.inputState.actions.chat) {
            this.inputState.actions.chat = false;
            this.callbacks.onChatRelease?.();
          }
          break;
      }
    });
  }

  private setupMobileControls() {
    this.mobileControls.onJoystickChange = (state: JoystickState) => {
      this.updateJoystick(state.x, state.y, state.active);
    };

    this.mobileControls.onFishButtonPress = () => {
      if (!this.inputState.actions.fish) {
        this.inputState.actions.fish = true;
        this.callbacks.onFishPress?.();
      }
    };

    this.mobileControls.onFishButtonRelease = () => {
      if (this.inputState.actions.fish) {
        this.inputState.actions.fish = false;
        this.callbacks.onFishRelease?.();
      }
    };

    this.mobileControls.onChatButtonPress = () => {
      this.inputState.actions.chat = true;
      this.callbacks.onChatPress?.();
    };

    this.mobileControls.onChatButtonRelease = () => {
      this.inputState.actions.chat = false;
      this.callbacks.onChatRelease?.();
    };
  }

  // todo, fix this abomination
  public addCallbacks(callback: InputCallbacks) {
    // Merge callbacks instead of overwriting
    Object.keys(callback).forEach((key) => {
      const callbackKey = key as keyof InputCallbacks;
      const existingCallback = this.callbacks[callbackKey];
      const newCallback = callback[callbackKey];

      if (existingCallback && newCallback) {
        // Create a combined callback that calls both
        this.callbacks[callbackKey] = (() => {
          existingCallback();
          newCallback();
        }) as any;
      } else if (newCallback) {
        // No existing callback, just set the new one
        this.callbacks[callbackKey] = newCallback;
      }
    });
  }

  // i have not tested this and i feel like it doesnt work.
  public clearCallbacks(callbacks: InputCallbacks) {
    Object.keys(callbacks).forEach((key) => {
      const callbackKey = key as keyof InputCallbacks;
      delete this.callbacks[callbackKey];
    });
  }

  public updateJoystick(x: number, y: number, active: boolean) {
    this.inputState.joystick.x = x;
    this.inputState.joystick.y = y;
    this.inputState.joystick.active = active;

    // Convert joystick input to movement state
    if (active) {
      this.inputState.movement.forward = y < -0.3;
      this.inputState.movement.backward = y > 0.3;
      this.inputState.movement.left = x < -0.3;
      this.inputState.movement.right = x > 0.3;
    } else {
      // Reset movement when joystick is not active (unless keyboard is being used)
      if (!this.isKeyboardMovementActive()) {
        this.inputState.movement.forward = false;
        this.inputState.movement.backward = false;
        this.inputState.movement.left = false;
        this.inputState.movement.right = false;
      }
    }
  }

  private isKeyboardMovementActive(): boolean {
    // Check if any movement keys are currently pressed
    // This prevents joystick from overriding keyboard input
    return false; // For now, we'll let joystick override keyboard
  }

  public getInputState(): Readonly<InputState> {
    return this.inputState;
  }

  public isMovementActive(): boolean {
    return (
      this.inputState.movement.forward ||
      this.inputState.movement.backward ||
      this.inputState.movement.left ||
      this.inputState.movement.right
    );
  }

  public getMovementVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (this.inputState.movement.left) x -= 1;
    if (this.inputState.movement.right) x += 1;
    if (this.inputState.movement.forward) y += 1;
    if (this.inputState.movement.backward) y -= 1;

    // If joystick is active, use its values instead
    if (this.inputState.joystick.active) {
      x = this.inputState.joystick.x;
      y = -this.inputState.joystick.y; // Invert Y for forward/backward
    }

    return { x, y };
  }

  public destroy() {
    this.mobileControls.destroy();
  }
}
