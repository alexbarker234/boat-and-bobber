import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";

export class PhysicsManager {
  private static instance: PhysicsManager;
  private world: RAPIER.World;
  private debugMeshes: Map<number, THREE.Mesh> = new Map();
  private debugScene: THREE.Scene;

  private constructor(debugScene: THREE.Scene) {
    this.debugScene = debugScene;
    this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
  }

  public static async initialize(debugScene: THREE.Scene): Promise<PhysicsManager> {
    if (!PhysicsManager.instance) {
      await RAPIER.init();
      PhysicsManager.instance = new PhysicsManager(debugScene);
    }
    return PhysicsManager.instance;
  }

  public static getInstance(): PhysicsManager {
    if (!PhysicsManager.instance) {
      throw new Error("PhysicsManager not initialized");
    }
    return PhysicsManager.instance;
  }

  public getWorld(): RAPIER.World {
    return this.world;
  }

  public update() {
    this.world.step();
    this.updateDebugMeshes();
  }

  public createDebugMesh(collider: RAPIER.Collider): void {
    const shape = collider.shape;
    let geometry: THREE.BufferGeometry;

    if (shape.type === RAPIER.ShapeType.Cuboid) {
      const halfExtents = shape as RAPIER.Cuboid;
      geometry = new THREE.BoxGeometry(
        halfExtents.halfExtents.x * 2,
        halfExtents.halfExtents.y * 2,
        halfExtents.halfExtents.z * 2
      );
    } else if (shape.type === RAPIER.ShapeType.Ball) {
      const radius = (shape as RAPIER.Ball).radius;
      geometry = new THREE.SphereGeometry(radius);
    } else {
      return;
    }

    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });

    const mesh = new THREE.Mesh(geometry, material);
    this.debugMeshes.set(collider.handle, mesh);
    this.debugScene.add(mesh);
  }

  private updateDebugMeshes() {
    this.debugMeshes.forEach((mesh, handle) => {
      const collider = this.world.getCollider(handle);
      if (collider) {
        const position = collider.translation();
        const rotation = collider.rotation();
        mesh.position.set(position.x, position.y, position.z);
        mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      }
    });
  }
}
