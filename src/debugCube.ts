import { BoxGeometry, DoubleSide, Mesh, MeshStandardMaterial } from "three";
import { Entity } from "./entities/entity";

export class DebugCube extends Entity {
  private cube: Mesh;

  constructor() {
    super();
    const geometry = new BoxGeometry(0.5, 0.5, 0.5);
    const materials = [
      new MeshStandardMaterial({ color: 0xff0000, side: DoubleSide }), // right - red
      new MeshStandardMaterial({ color: 0x00ff00, side: DoubleSide }), // left - green
      new MeshStandardMaterial({ color: 0x0000ff, side: DoubleSide }), // top - blue
      new MeshStandardMaterial({ color: 0xffff00, side: DoubleSide }), // bottom - yellow
      new MeshStandardMaterial({ color: 0xff00ff, side: DoubleSide }), // front - magenta
      new MeshStandardMaterial({ color: 0x00ffff, side: DoubleSide }) // back - cyan
    ];
    this.cube = new Mesh(geometry, materials);
    this.cube.position.set(0, 2, 0); // Position the cube above the water
  }

  getMesh(): Mesh {
    return this.cube;
  }

  update(): void {
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
  }
}
