import { Collider, ColliderDesc, RigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Euler, MathUtils, Mesh, MeshStandardMaterial, Quaternion, Scene, Vector3 } from "three";
import { FishingSystem } from "../fishing/fishingSystem";
import { AssetLoader } from "../systems/assetLoader";
import { InputManager } from "../systems/inputManager";
import { PhysicsManager } from "../systems/physicsManager";
import { PhysicsEntity } from "./physicsEntity";

export class Boat extends PhysicsEntity {
  private mesh!: Mesh;
  private readonly acceleration = 0.002;
  private readonly rotationSpeed = 0.01;
  private currentTilt = 0;
  private fishingSystem!: FishingSystem;
  private inputManager: InputManager;

  // Store initial transform values
  private readonly initialPosition = { x: 0, y: 0.01, z: 0 };
  private readonly initialRotation = { x: 0, y: 0, z: 0, w: 1 };

  get position() {
    return this.mesh.position;
  }
  get quaternion() {
    return this.mesh.quaternion;
  }

  // shut up, yes its intiialised in the constructor
  public rigidBody!: RigidBody;
  public collider!: Collider;

  constructor(scene: Scene) {
    super();
    this.inputManager = InputManager.getInstance();
    this.createMesh();
    this.setupPhysics();
    this.fishingSystem = new FishingSystem(scene, this);
    this.setupInputCallbacks();
  }

  private setupInputCallbacks() {
    this.inputManager.addCallbacks({
      onResetPress: () => this.resetBoat()
    });
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

  private setupPhysics() {
    const world = PhysicsManager.getInstance().getWorld();

    // Create rigid body for the boat
    const rigidBodyDesc = RigidBodyDesc.dynamic()
      .setTranslation(0, 0.01, 0)
      .setGravityScale(0)
      .setLinearDamping(0)
      .setAngularDamping(0.8);

    this.rigidBody = world.createRigidBody(rigidBodyDesc);

    // Create collider for the boat (simplified box shape)
    const colliderDesc = ColliderDesc.cuboid(0.5, 0.2, 0.25);
    this.collider = world.createCollider(colliderDesc, this.rigidBody);

    // Create debug visualization
    PhysicsManager.getInstance().createDebugMesh(this.collider);
  }

  public getMesh(): Mesh {
    return this.mesh;
  }

  public update() {
    if (!this.mesh || !this.rigidBody) return;

    this.fishingSystem.update();
    this.updateAngularVelocity();
    this.updateLinearVelocity();
    this.updateMeshFromPhysics();
  }

  private updateAngularVelocity() {
    const currentAngvel = this.rigidBody.angvel();
    const maxAngularSpeed = 0.5;
    const inputState = this.inputManager.getInputState();

    if (!this.fishingSystem.isFishing()) {
      if (inputState.movement.left) {
        const newAngvel = currentAngvel.y + this.rotationSpeed;
        this.rigidBody.setAngvel(
          {
            x: 0,
            y: Math.min(newAngvel, maxAngularSpeed),
            z: 0
          },
          true
        );
      } else if (inputState.movement.right) {
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
  }

  private updateLinearVelocity() {
    // Always keep the y velocity to 0
    this.rigidBody.setLinvel({ x: this.rigidBody.linvel().x, y: 0, z: this.rigidBody.linvel().z }, true);

    // Update velocity based on input
    const physicsRotation = this.rigidBody.rotation();
    const forward = new Vector3(1, 0, 0).applyQuaternion(
      new Quaternion(physicsRotation.x, physicsRotation.y, physicsRotation.z, physicsRotation.w)
    );

    const inputState = this.inputManager.getInputState();

    if (!this.fishingSystem.isFishing()) {
      if (inputState.movement.forward || inputState.movement.backward) {
        const impulse = forward.multiplyScalar(inputState.movement.forward ? this.acceleration : -this.acceleration);
        this.rigidBody.applyImpulse({ x: impulse.x, y: 0, z: impulse.z }, true);
      }
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
    const physicsQuaternion = new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
    const offsetQuaternion = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0));

    // Add smooth tilt based on angular velocity
    const angularVel = this.rigidBody.angvel();
    const targetTilt = -angularVel.y * 0.5;
    this.currentTilt = MathUtils.lerp(this.currentTilt, targetTilt, 0.15);
    const angularTilt = new Quaternion().setFromEuler(new Euler(this.currentTilt, 0, 0));

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

  public isFishing() {
    return this.fishingSystem.isFishing();
  }

  private resetBoat() {
    if (!this.rigidBody || !this.mesh) return;

    // Reset physics body position and rotation
    this.rigidBody.setTranslation(this.initialPosition, true);
    this.rigidBody.setRotation(this.initialRotation, true);

    // Reset velocities
    this.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // Reset visual tilt
    this.currentTilt = 0;

    // Update mesh position and rotation
    this.mesh.position.set(this.initialPosition.x, this.initialPosition.y, this.initialPosition.z);
    const offsetQuaternion = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0));
    this.mesh.quaternion.copy(offsetQuaternion);
  }

  public destroy() {
    this.fishingSystem.destroy();
  }
}
