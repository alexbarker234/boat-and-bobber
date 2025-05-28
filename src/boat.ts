import { Mesh, MeshStandardMaterial, Vector3 } from "three";
import { AssetLoader } from "./assetLoader";

export class Boat {
  private mesh: Mesh | null = null;
  private readonly maxSpeed = 0.05;
  private readonly acceleration = 0.002;
  private readonly deceleration = 0.025;
  private readonly rotationSpeed = 0.03;
  private readonly minSpeedThreshold = 0.0001;

  private velocity = new Vector3(0, 0, 0);

  private keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  constructor() {
    this.setupKeyboardControls();
    this.createMesh();
  }

  private createMesh() {
    const geometry = AssetLoader.getInstance().getAsset("benchy");
    if (!geometry) {
      console.error("Benchy model not loaded!");
      return;
    }

    const material = new MeshStandardMaterial({ color: 0xffffff });
    this.mesh = new Mesh(geometry, material);
    this.mesh.scale.set(0.02, 0.02, 0.02);
    this.mesh.position.set(0, 0.5, 0);
    this.mesh.rotation.set(-Math.PI / 2, 0, 0);
  }

  private setupKeyboardControls() {
    window.addEventListener("keydown", (e) => {
      switch (e.key.toLowerCase()) {
        case "w":
          this.keys.forward = true;
          break;
        case "s":
          this.keys.backward = true;
          break;
        case "a":
          this.keys.left = true;
          break;
        case "d":
          this.keys.right = true;
          break;
      }
    });

    window.addEventListener("keyup", (e) => {
      switch (e.key.toLowerCase()) {
        case "w":
          this.keys.forward = false;
          break;
        case "s":
          this.keys.backward = false;
          break;
        case "a":
          this.keys.left = false;
          break;
        case "d":
          this.keys.right = false;
          break;
      }
    });
  }

  public getMesh(): Mesh | null {
    return this.mesh;
  }

  public update() {
    if (!this.mesh) return;

    // Handle rotation
    if (this.keys.left) {
      this.mesh.rotateZ(this.rotationSpeed);
    }
    if (this.keys.right) {
      this.mesh.rotateZ(-this.rotationSpeed);
    }

    // Update velocity based on input
    const forward = new Vector3(1, 0, 0).applyQuaternion(this.mesh.quaternion);

    if (this.keys.forward) {
      this.velocity.addScaledVector(forward, this.acceleration);
    } else if (this.keys.backward) {
      this.velocity.addScaledVector(forward, -this.acceleration);
    } else {
      // Apply stronger deceleration when no movement keys are pressed
      this.velocity.multiplyScalar(1 - this.deceleration);

      // Stop completely if moving very slowly
      if (this.velocity.length() < this.minSpeedThreshold) {
        this.velocity.set(0, 0, 0);
      }
    }

    // Clamp velocity to max speed
    if (this.velocity.length() > this.maxSpeed) {
      this.velocity.normalize().multiplyScalar(this.maxSpeed);
    }

    // Apply velocity to position
    this.mesh.position.add(this.velocity);

    // Keep boat at water level
    this.mesh.position.y = 0.5;
  }

  public getPosition(): Vector3 {
    return this.mesh ? this.mesh.position : new Vector3();
  }

  public getQuaternion() {
    return this.mesh ? this.mesh.quaternion : null;
  }
}
