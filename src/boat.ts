import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { Mesh, MeshStandardMaterial, Vector3 } from "three";
import { AssetLoader } from "./assetLoader";
import { PhysicsManager } from "./physics/physicsManager";

export class Boat {
  private mesh!: Mesh;
  private readonly acceleration = 0.002;
  private readonly rotationSpeed = 0.01;
  private currentTilt = 0;

  private keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  // shut up, yes its intiialised in the constructor
  private rigidBody!: RAPIER.RigidBody;
  private collider!: RAPIER.Collider;

  constructor() {
    this.setupKeyboardControls();
    this.createMesh();
    this.setupPhysics();
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
    this.mesh.position.set(0, 0, 0);
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

  private setupPhysics() {
    const world = PhysicsManager.getInstance().getWorld();

    // Create rigid body for the boat
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, 0.01, 0)
      .setGravityScale(0)
      .setLinearDamping(0)
      .setAngularDamping(0.8);

    this.rigidBody = world.createRigidBody(rigidBodyDesc);

    // Create collider for the boat (simplified box shape)
    const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.2, 0.25);
    this.collider = world.createCollider(colliderDesc, this.rigidBody);

    // Create debug visualization
    PhysicsManager.getInstance().createDebugMesh(this.collider);
  }

  public getMesh(): Mesh | null {
    return this.mesh;
  }

  public update() {
    if (!this.mesh || !this.rigidBody) return;

    this.updateAngularVelocity();
    this.updateLinearVelocity();
    this.updateMeshFromPhysics();

    // Log vels
    const linvel = this.rigidBody.linvel();
    const angvel = this.rigidBody.angvel();
    console.log(
      "linvel",
      linvel,
      "x:",
      Math.abs(linvel.x) < 0.001 ? "under 0.001" : "normal",
      "y:",
      Math.abs(linvel.y) < 0.001 ? "under 0.001" : "normal",
      "z:",
      Math.abs(linvel.z) < 0.001 ? "under 0.001" : "normal"
    );
    console.log(
      "angvel",
      angvel,
      "x:",
      Math.abs(angvel.x) < 0.001 ? "under 0.001" : "normal",
      "y:",
      Math.abs(angvel.y) < 0.001 ? "under 0.001" : "normal",
      "z:",
      Math.abs(angvel.z) < 0.001 ? "under 0.001" : "normal"
    );
  }

  private updateAngularVelocity() {
    const currentAngvel = this.rigidBody.angvel();
    const maxAngularSpeed = 0.5;

    if (this.keys.left) {
      const newAngvel = currentAngvel.y + this.rotationSpeed;
      this.rigidBody.setAngvel(
        {
          x: 0,
          y: Math.min(newAngvel, maxAngularSpeed),
          z: 0
        },
        true
      );
    } else if (this.keys.right) {
      const newAngvel = currentAngvel.y - this.rotationSpeed;
      this.rigidBody.setAngvel(
        {
          x: 0,
          y: Math.max(newAngvel, -maxAngularSpeed),
          z: 0
        },
        true
      );
    }
  }

  private updateLinearVelocity() {
    // Always keep the y velocity to 0
    this.rigidBody.setLinvel({ x: this.rigidBody.linvel().x, y: 0, z: this.rigidBody.linvel().z }, true);

    // Update velocity based on input
    const physicsRotation = this.rigidBody.rotation();
    const forward = new Vector3(1, 0, 0).applyQuaternion(
      new THREE.Quaternion(physicsRotation.x, physicsRotation.y, physicsRotation.z, physicsRotation.w)
    );

    if (this.keys.forward || this.keys.backward) {
      const impulse = forward.multiplyScalar(this.keys.forward ? this.acceleration : -this.acceleration);
      this.rigidBody.applyImpulse({ x: impulse.x, y: 0, z: impulse.z }, true);
    }

    // After applying forces, cap the velocity
    const velocity = this.rigidBody.linvel();
    const maxSpeed = 1;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      this.rigidBody.setLinvel({ x: velocity.x * scale, y: 0, z: velocity.z * scale }, true);
    }

    // Manually dampen velocity
    this.rigidBody.setLinvel({ x: velocity.x * 0.992, y: 0, z: velocity.z * 0.992 }, true);
    const linvel = this.rigidBody.linvel();
    if (Math.abs(linvel.x) < 0.001) this.rigidBody.setLinvel({ x: 0, y: 0, z: this.rigidBody.linvel().z }, true);
    if (Math.abs(linvel.z) < 0.001) this.rigidBody.setLinvel({ x: this.rigidBody.linvel().x, y: 0, z: 0 }, true);
  }

  private updateMeshFromPhysics() {
    // Update mesh position and rotation from physics
    const position = this.rigidBody.translation();

    // Keep Y at water level
    this.mesh.position.set(position.x, 0.01, position.z);

    // Apply both physics rotation and the visual offset with smooth tilt
    const rotation = this.rigidBody.rotation();
    const physicsQuaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
    const offsetQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));

    // Add smooth tilt based on angular velocity
    const angularVel = this.rigidBody.angvel();
    const targetTilt = -angularVel.y * 0.5;
    this.currentTilt = THREE.MathUtils.lerp(this.currentTilt, targetTilt, 0.15);
    const angularTilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.currentTilt, 0, 0));

    // Combine all rotations
    this.mesh.quaternion.multiplyQuaternions(physicsQuaternion, offsetQuaternion);
    this.mesh.quaternion.multiply(angularTilt);

    // Keep physics body at water level
    this.rigidBody.setTranslation({ x: position.x, y: 0.01, z: position.z }, true);
  }

  public getPosition(): Vector3 {
    return this.mesh ? this.mesh.position : new Vector3();
  }

  public getQuaternion() {
    return this.mesh ? this.mesh.quaternion : null;
  }
}
