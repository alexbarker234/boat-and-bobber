import RAPIER from "@dimforge/rapier3d-compat";
import { Mesh, MeshStandardMaterial, Vector3 } from "three";
import { AssetLoader } from "../assetLoader";
import { PhysicsManager } from "../physics/physicsManager";

export class Rock {
  private mesh: Mesh | null = null;
  // shut up, yes its intiialised in the constructor
  private rigidBody!: RAPIER.RigidBody;
  private collider!: RAPIER.Collider;

  constructor(size: "large" | "medium" = "large", position: Vector3 = new Vector3(0, 0, 0)) {
    this.createMesh(size, position);
    this.setupPhysics(size, position);
  }

  private createMesh(size: "large" | "medium", position: Vector3) {
    const assetName = size === "large" ? "LargeRock" : "MediumRock";
    const geometry = AssetLoader.getInstance().getAsset(assetName);

    if (!geometry) {
      console.error(`${assetName} model not loaded!`);
      return;
    }

    const material = new MeshStandardMaterial({ color: 0x797e82 });
    this.mesh = new Mesh(geometry, material);
    this.mesh.position.copy(position);
    this.mesh.rotation.x = Math.PI;
    this.mesh.scale.set(3, 3, 3);
  }

  private setupPhysics(size: "large" | "medium", position: Vector3) {
    const world = PhysicsManager.getInstance().getWorld();

    // Create static rigid body for the rock
    const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z);
    this.rigidBody = world.createRigidBody(rigidBodyDesc);

    // Create collider with size based on rock type
    const radius = size === "large" ? 1.5 : 1.0;
    const colliderDesc = RAPIER.ColliderDesc.ball(radius);
    this.collider = world.createCollider(colliderDesc, this.rigidBody);

    // Create debug visualization
    PhysicsManager.getInstance().createDebugMesh(this.collider);
  }

  public getMesh(): Mesh | null {
    return this.mesh;
  }

  public getPosition(): Vector3 {
    return this.mesh ? this.mesh.position : new Vector3();
  }

  public setPosition(position: Vector3) {
    if (this.mesh) {
      this.mesh.position.copy(position);
    }
  }
}
