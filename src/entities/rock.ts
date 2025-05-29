import RAPIER from "@dimforge/rapier3d-compat";
import { Mesh, MeshStandardMaterial, Vector3 } from "three";
import { AssetLoader } from "../assetLoader";
import { PhysicsManager } from "../physics/physicsManager";
import { Entity } from "./entity";

const ROCK_VARIANTS = {
  large: {
    assetName: "LargeRock",
    colliderRadius: 0.9,
    scale: 3
  },
  medium: {
    assetName: "MediumRock",
    colliderRadius: 0.7,
    scale: 3
  }
} as const;

export class Rock extends Entity {
  private mesh: Mesh | null = null;
  // shut up, yes its intiialised in the constructor
  private rigidBody!: RAPIER.RigidBody;
  private collider!: RAPIER.Collider;

  constructor(size: "large" | "medium" = "large", position: Vector3 = new Vector3(0, 0, 0)) {
    super();
    this.createMesh(size, position);
    this.setupPhysics(size, position);
  }

  private createMesh(size: "large" | "medium", position: Vector3) {
    const variant = ROCK_VARIANTS[size];
    const geometry = AssetLoader.getInstance().getAsset(variant.assetName);

    if (!geometry) {
      console.error(`${variant.assetName} model not loaded!`);
      return;
    }

    const material = new MeshStandardMaterial({ color: 0x797e82 });
    this.mesh = new Mesh(geometry, material);
    this.mesh.position.copy(position);
    this.mesh.rotation.x = Math.PI;
    this.mesh.scale.set(variant.scale, variant.scale, variant.scale);
  }

  private setupPhysics(size: "large" | "medium", position: Vector3) {
    const world = PhysicsManager.getInstance().getWorld();
    const variant = ROCK_VARIANTS[size];

    // Create static rigid body for the rock
    const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z);
    this.rigidBody = world.createRigidBody(rigidBodyDesc);

    // Create collider with size based on rock type
    const colliderDesc = RAPIER.ColliderDesc.ball(variant.colliderRadius);
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
