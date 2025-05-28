import { Mesh, MeshStandardMaterial, Vector3 } from "three";
import { AssetLoader } from "../assetLoader";

export class Rock {
  private mesh: Mesh | null = null;

  constructor(size: "large" | "medium" = "large", position: Vector3 = new Vector3(0, 0, 0)) {
    this.createMesh(size, position);
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
