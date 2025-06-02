import { MobileControls } from "./mobileControls";

export type InputAction = "fish" | "chat" | "jump" | "attack" | "forward" | "backward" | "left" | "right" | "reset";

type InputCallback = () => void;

interface KeyBindings {
  onPress: Set<InputCallback>;
  onRelease: Set<InputCallback>;
}

export class InputManager {
  private static instance: InputManager;
  private keyStates: Set<string> = new Set(); // Keys currently held down
  private keyBindings: Map<string, KeyBindings> = new Map(); // key -> bindings

  private actionToKey: Map<InputAction, string> = new Map(); // action -> key
  private keyToActions: Map<string, Set<InputAction>> = new Map(); // key -> set of actions

  private mobileControls: MobileControls;

  private constructor() {
    this.setupDefaultKeyBindings();
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    this.mobileControls = new MobileControls(this);
  }

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  private setupDefaultKeyBindings() {
    // Set up default key mappings
    this.bindActionToKey("forward", "w");
    this.bindActionToKey("backward", "s");
    this.bindActionToKey("left", "a");
    this.bindActionToKey("right", "d");
    this.bindActionToKey("fish", "f");
    this.bindActionToKey("reset", "r");
    this.bindActionToKey("chat", "t");
  }

  // --- Event Handlers ---

  private handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (!this.keyStates.has(key)) {
      this.keyStates.add(key);
      const bindings = this.keyBindings.get(key);
      bindings?.onPress.forEach((cb) => cb());
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (this.keyStates.has(key)) {
      this.keyStates.delete(key);
      const bindings = this.keyBindings.get(key);
      bindings?.onRelease.forEach((cb) => cb());
    }
  };

  // --- Key-level Binding ---

  bindKeyPress(key: string, callback: InputCallback) {
    this.ensureKeyBinding(key);
    this.keyBindings.get(key)!.onPress.add(callback);
  }

  unbindKeyPress(key: string, callback: InputCallback) {
    this.keyBindings.get(key)?.onPress.delete(callback);
  }

  bindKeyRelease(key: string, callback: InputCallback) {
    this.ensureKeyBinding(key);
    this.keyBindings.get(key)!.onRelease.add(callback);
  }

  unbindKeyRelease(key: string, callback: InputCallback) {
    this.keyBindings.get(key)?.onRelease.delete(callback);
  }

  isKeyDown(key: string): boolean {
    return this.keyStates.has(key);
  }

  private ensureKeyBinding(key: string) {
    if (!this.keyBindings.has(key)) {
      this.keyBindings.set(key, {
        onPress: new Set(),
        onRelease: new Set()
      });
    }
  }

  // --- Action-level Binding ---

  bindActionToKey(action: InputAction, key: string) {
    this.actionToKey.set(action, key);
    if (!this.keyToActions.has(key)) {
      this.keyToActions.set(key, new Set());
    }
    this.keyToActions.get(key)!.add(action);
  }

  getKeyForAction(action: InputAction): string | undefined {
    return this.actionToKey.get(action);
  }

  isActionDown(action: InputAction): boolean {
    const key = this.getKeyForAction(action);
    return key ? this.isKeyDown(key) : false;
  }

  bindActionPress(action: InputAction, callback: InputCallback) {
    const key = this.getKeyForAction(action);
    if (!key) throw new Error(`No key bound to action "${action}"`);
    this.bindKeyPress(key, callback);
  }

  unbindActionPress(action: InputAction, callback: InputCallback) {
    const key = this.getKeyForAction(action);
    if (key) this.unbindKeyPress(key, callback);
  }

  bindActionRelease(action: InputAction, callback: InputCallback) {
    const key = this.getKeyForAction(action);
    if (!key) throw new Error(`No key bound to action "${action}"`);
    this.bindKeyRelease(key, callback);
  }

  unbindActionRelease(action: InputAction, callback: InputCallback) {
    const key = this.getKeyForAction(action);
    if (key) this.unbindKeyRelease(key, callback);
  }

  // --- HTML Button Binding ---

  bindButtonToAction(button: HTMLElement, action: InputAction) {
    const key = this.getKeyForAction(action);
    if (!key) throw new Error(`No key bound to action "${action}"`);
    this.bindButtonToKey(button, key);
  }

  private bindButtonToKey(button: HTMLElement, key: string) {
    button.addEventListener("mousedown", () => this.simulateKeyPress(key));
    button.addEventListener("mouseup", () => this.simulateKeyRelease(key));
    button.addEventListener("mouseleave", () => this.simulateKeyRelease(key));

    //  handle touch events for mobile
    button.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.simulateKeyPress(key);
    });
    button.addEventListener("touchend", (e) => {
      e.preventDefault();
      this.simulateKeyRelease(key);
    });
  }

  simulateKeyPress(key: string) {
    if (!this.keyStates.has(key)) {
      this.keyStates.add(key);
      const bindings = this.keyBindings.get(key);
      bindings?.onPress.forEach((cb) => cb());
    }
  }

  simulateKeyRelease(key: string) {
    if (this.keyStates.has(key)) {
      this.keyStates.delete(key);
      const bindings = this.keyBindings.get(key);
      bindings?.onRelease.forEach((cb) => cb());
    }
  }

  public destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.mobileControls.destroy();
  }
}
