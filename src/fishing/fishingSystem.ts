import { Quaternion, Scene, Vector3 } from "three";
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
  private scene: Scene;

  private keys = {
    fishing: false
  };

  constructor(scene: Scene) {
    this.scene = scene;
    this.rod = new FishingRod();
    this.fishManager = new FishManager();
    this.rhythmGame = new RhythmGame();
    this.ui = new FishingUI();

    this.setupControls();
    this.addRodToScene();
  }

  private setupControls() {
    window.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        // Left click
        this.keys.fishing = true;
        this.startFishing();
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        this.keys.fishing = false;
        if (this.state === "casting" || this.state === "waiting") {
          this.reelIn();
        }
      }
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

  public update(boatPosition: Vector3, boatQuaternion: Quaternion) {
    // Update rod position
    this.rod.updatePosition(boatPosition, boatQuaternion);
    // Position rod on the left side of the boat and angle it 45 degrees upwards
    const rodOffset = new Vector3(0, 0.25, 0.25);
    rodOffset.applyQuaternion(boatQuaternion);
    this.rod.getRodMesh().position.copy(boatPosition).add(rodOffset);
    this.rod.getRodMesh().quaternion.copy(boatQuaternion);

    // Apply 45-degree upward rotation
    const upwardRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
    this.rod.getRodMesh().quaternion.multiply(upwardRotation);

    switch (this.state) {
      case "casting":
        this.updateCasting(boatPosition, boatQuaternion);
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
  }

  private updateCasting(boatPosition: Vector3, boatQuaternion: Quaternion) {
    if (!this.keys.fishing) {
      this.reelIn();
      return;
    }

    const forward = new Vector3(1, 0, 0).applyQuaternion(boatQuaternion);

    // Check if we need to start casting
    if (!this.rod.getLineMesh()) {
      this.rod.startCasting(boatPosition, forward);
    }

    const castComplete = this.rod.updateCasting(boatPosition, forward);

    if (castComplete) {
      this.state = "waiting";
      this.waitStartTime = Date.now();
      this.biteWaitTime = (Math.random() * 5 + 2) * 1000; // 2-7 seconds
      this.ui.showStatus("Waiting for a bite... (hold to keep line out)");
    }
  }

  private updateWaiting() {
    if (!this.keys.fishing) {
      this.reelIn();
      return;
    }

    const waitTime = Date.now() - this.waitStartTime;

    if (waitTime >= this.biteWaitTime) {
      // Check for fish bite
      const fish = this.fishManager.checkForBite();
      console.log(fish);

      if (fish) {
        this.currentFish = fish;
        this.state = "bite";
        this.ui.showStatus("Fish on the line! Get ready...");

        // Start minigame after a short delay
        setTimeout(() => {
          if (this.state === "bite") {
            this.startMinigame();
          }
        }, 1000);
      } else {
        // Reset wait time for another chance
        this.waitStartTime = Date.now();
        this.biteWaitTime = (Math.random() * 3 + 1) * 1000;
      }
    }
  }

  private updateBite() {
    if (!this.keys.fishing) {
      this.reelIn();
      return;
    }
    // Waiting for minigame to start
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
    if (success && this.currentFish) {
      this.ui.showResult(true, this.currentFish.type);
      console.log(`Caught a ${this.currentFish.type} fish!`);
    } else {
      this.ui.showResult(false);
      console.log("Fish escaped!");
    }

    this.currentFish = null;
    this.reelIn();
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
}
