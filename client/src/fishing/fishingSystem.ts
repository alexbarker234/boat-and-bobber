import { Quaternion, Scene, Vector3 } from "three";
import { Boat } from "../entities/boat";
import { InputManager } from "../systems/inputManager";
import { Fish, FishManager } from "./fish";
import { FishingRod } from "./fishingRod";
import { FishingUI } from "./fishingUI";
import { RhythmGame } from "./rhythmGame";

export type FishingState = "idle" | "casting" | "waiting" | "bite" | "minigame" | "reeling";

export class FishingSystem {
  private rod: FishingRod;
  private fishManager: FishManager;
  private rhythmGame: RhythmGame;
  private ui: FishingUI;
  private state: FishingState = "idle";
  private currentFish: Fish | null = null;
  private waitStartTime: number = 0;
  private biteWaitTime: number = 0;
  private biteStartTime: number = 0;
  private scene: Scene;
  private boatParent: Boat;

  constructor(scene: Scene, boatParent: Boat) {
    this.scene = scene;
    this.boatParent = boatParent;
    this.rod = new FishingRod(this.boatParent);
    this.fishManager = new FishManager();
    this.rhythmGame = new RhythmGame();
    this.ui = new FishingUI();

    this.setupInputCallbacks();
    this.addRodToScene();
  }

  private setupInputCallbacks() {
    InputManager.getInstance().addCallbacks({
      onFishPress: () => this.handleFishingPress()
    });
  }

  private addRodToScene() {
    this.scene.add(this.rod.getRodMesh());
  }

  private startFishing() {
    if (this.state !== "idle") return;

    this.state = "casting";
    this.ui.showStatus("Casting line...");
  }

  public update() {
    // Update rod position
    this.rod.updatePosition(this.boatParent.position, this.boatParent.quaternion);
    // Position rod on the left side of the boat and angle it 45 degrees upwards
    const rodOffset = new Vector3(0, 0.25, 0.25);
    rodOffset.applyQuaternion(this.boatParent.quaternion);
    this.rod.getRodMesh().position.copy(this.boatParent.position).add(rodOffset);
    this.rod.getRodMesh().quaternion.copy(this.boatParent.quaternion);

    // Apply 45-degree upward rotation
    const upwardRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
    this.rod.getRodMesh().quaternion.multiply(upwardRotation);

    switch (this.state) {
      case "casting":
        this.updateCasting();
        break;
      case "waiting":
        this.updateWaiting();
        break;
      case "bite":
        this.updateBite();
        break;
      case "minigame":
        this.updateMinigame();
        break;
    }

    // Update line mesh in scene
    const lineMesh = this.rod.getLineMesh();
    if (lineMesh && !lineMesh.parent) {
      this.scene.add(lineMesh);
    }
    this.rod.updateLine();
  }

  private handleFishingPress() {
    if (this.state === "bite") {
      this.startMinigame();
    } else if (this.state === "idle") {
      this.startFishing();
    } else if (this.state === "casting" || this.state === "waiting") {
      this.reelIn();
    }
  }

  private updateCasting() {
    // Check if we need to start casting
    if (!this.rod.getLineMesh()) {
      this.rod.startCasting();
    }

    const castComplete = this.rod.updateCasting();

    if (castComplete) {
      this.state = "waiting";
      this.waitStartTime = Date.now();
      this.biteWaitTime = (Math.random() * 5 + 2) * 1000; // 2-7 seconds
      this.ui.showStatus("Waiting for a bite... (release F to reel in)");
    }
  }

  private updateWaiting() {
    const waitTime = Date.now() - this.waitStartTime;

    if (waitTime >= this.biteWaitTime) {
      // Check for fish bite
      const fish = this.fishManager.checkForBite();
      console.log(fish);

      if (fish) {
        this.currentFish = fish;
        this.state = "bite";
        this.biteStartTime = Date.now();
        this.ui.showStatus("Fish on the line! Press F quickly!");
      } else {
        // Reset wait time for another chance
        this.waitStartTime = Date.now();
        this.biteWaitTime = (Math.random() * 3 + 1) * 1000;
      }
    }
  }

  private updateBite() {
    const biteTime = Date.now() - this.biteStartTime;

    // Player has 1 second to press F
    if (biteTime >= 1000) {
      // Time's up - fish escaped
      this.ui.showStatus("Too slow! The fish got away...");
      setTimeout(() => {
        this.reelIn();
      }, 1500);
    }
  }

  private startMinigame() {
    if (!this.currentFish) return;

    this.state = "minigame";

    let difficulty: "easy" | "medium" | "hard";
    switch (this.currentFish.type) {
      case "common":
        difficulty = "easy";
        break;
      case "rare":
        difficulty = "medium";
        break;
      case "legendary":
        difficulty = "hard";
        break;
    }

    this.rhythmGame.start(difficulty, (success) => {
      this.endMinigame(success);
    });
  }

  private updateMinigame() {
    const gameState = this.rhythmGame.update();
    this.ui.showRhythmGame(gameState);
  }

  private endMinigame(success: boolean) {
    this.reelIn();

    if (success && this.currentFish) {
      this.ui.showResult(true);
      console.log(`Caught a ${this.currentFish.type} fish!`);
    } else {
      this.ui.showResult(false);
      console.log("Fish escaped!");
    }

    this.currentFish = null;
  }

  private reelIn() {
    this.rod.reelIn();
    this.state = "idle";
    this.ui.hideStatus();

    // Remove line from scene
    const lineMesh = this.rod.getLineMesh();
    if (lineMesh && lineMesh.parent) {
      this.scene.remove(lineMesh);
    }
  }

  public getState(): FishingState {
    return this.state;
  }

  public isFishing(): boolean {
    return this.state !== "idle";
  }

  public destroy() {
    const inputManager = InputManager.getInstance();
    inputManager.clearCallbacks({
      onFishPress: () => this.handleFishingPress()
    });
  }
}
