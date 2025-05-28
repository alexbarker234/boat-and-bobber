import * as THREE from "three";
import { BufferGeometry, CylinderGeometry, Line, LineBasicMaterial, Mesh, MeshStandardMaterial, Vector3 } from "three";

export class FishingRod {
  private rodMesh!: Mesh;
  private lineMesh: Line | null = null;
  private hookPosition: Vector3 = new Vector3();
  private isLineOut = false;
  private lineLength = 0;
  private maxLineLength = 5;
  private castSpeed = 0.1;

  constructor() {
    this.createRod();
  }

  private createRod() {
    // Create a simple rod (cylinder)
    const rodGeometry = new CylinderGeometry(0.02, 0.02, 1.5);
    const rodMaterial = new MeshStandardMaterial({ color: 0x8b4513 });
    this.rodMesh = new Mesh(rodGeometry, rodMaterial);
  }

  public startCasting(startPosition: Vector3, direction: Vector3) {
    if (this.isLineOut) return;

    this.isLineOut = true;
    this.lineLength = 0;
    this.hookPosition.copy(startPosition);

    // Create the fishing line
    this.createLine(startPosition);
  }

  private createLine(startPosition: Vector3) {
    const points = [startPosition.clone(), this.hookPosition.clone()];

    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new LineBasicMaterial({ color: 0x000000 });
    this.lineMesh = new Line(geometry, material);
  }

  public updateCasting(boatPosition: Vector3, boatDirection: Vector3): boolean {
    if (!this.isLineOut || this.lineLength >= this.maxLineLength) {
      return this.lineLength >= this.maxLineLength;
    }

    this.lineLength += this.castSpeed;

    // Update hook position
    this.hookPosition.copy(boatPosition).add(boatDirection.clone().multiplyScalar(this.lineLength));
    this.hookPosition.y = -0.5; // Below water surface

    // Update line geometry
    if (this.lineMesh) {
      const points = [
        boatPosition.clone().add(new Vector3(0, 0.5, 0)), // Rod tip
        this.hookPosition.clone()
      ];
      this.lineMesh.geometry.setFromPoints(points);
    }

    return false; // Still casting
  }

  public reelIn() {
    this.isLineOut = false;
    this.lineLength = 0;
    if (this.lineMesh) {
      this.lineMesh.removeFromParent();
      this.lineMesh = null;
    }
  }

  public getHookPosition(): Vector3 {
    return this.hookPosition.clone();
  }

  public isLineCast(): boolean {
    return this.isLineOut && this.lineLength >= this.maxLineLength;
  }

  public getRodMesh(): Mesh {
    return this.rodMesh;
  }

  public getLineMesh(): Line | null {
    return this.lineMesh;
  }

  public updatePosition(boatPosition: Vector3, boatQuaternion: THREE.Quaternion) {
    // Position rod relative to boat
    const rodOffset = new Vector3(0.3, 0.3, 0);
    rodOffset.applyQuaternion(boatQuaternion);
    this.rodMesh.position.copy(boatPosition).add(rodOffset);
    this.rodMesh.quaternion.copy(boatQuaternion);
  }
}
