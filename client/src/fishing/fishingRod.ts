import * as THREE from "three";
import { BufferGeometry, CylinderGeometry, Line, LineBasicMaterial, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { Boat } from "../entities/boat";
export class FishingRod {
  private rodMesh!: Mesh;
  private lineMesh: Line | null = null;
  private hookPosition: Vector3 = new Vector3();
  private isLineOut = false;
  private lineLength = 0;
  private maxLineLength = 3;
  private castSpeed = 0.1;

  private rodLength = 0.8;

  private boatParent: Boat;

  constructor(boatParent: Boat) {
    this.boatParent = boatParent;
    this.createRod();
  }

  private createRod() {
    // Create a simple rod (cylinder)
    const rodGeometry = new CylinderGeometry(0.02, 0.02, this.rodLength);
    const rodMaterial = new MeshStandardMaterial({ color: 0x8b4513 });
    this.rodMesh = new Mesh(rodGeometry, rodMaterial);

    // Move the rod so its origin is at one end (bottom)
    this.rodMesh.geometry.translate(0, this.rodLength / 2, 0);
  }

  public startCasting() {
    if (this.isLineOut) return;

    this.isLineOut = true;
    this.lineLength = 0;
    this.hookPosition.copy(this.boatParent.position);

    this.createLine(this.boatParent.position);
  }

  private createLine(startPosition: Vector3) {
    const points = [startPosition.clone(), this.hookPosition.clone()];

    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new LineBasicMaterial({ color: 0x000000 });
    this.lineMesh = new Line(geometry, material);
  }

  public updateLine() {
    if (this.lineMesh) {
      const rodTipOffset = new Vector3(0, this.rodLength, 0);
      const rodTipPosition = this.rodMesh.position.clone().add(rodTipOffset.applyQuaternion(this.rodMesh.quaternion));

      const points = [rodTipPosition, this.hookPosition.clone()];
      this.lineMesh.geometry.setFromPoints(points);
    }
  }

  public updateCasting(): boolean {
    if (!this.isLineOut || this.lineLength >= this.maxLineLength) {
      return this.lineLength >= this.maxLineLength;
    }

    this.lineLength += this.castSpeed;

    // Update hook position - cast to the left of the boat
    const leftDirection = new Vector3(0, 1, 0).applyQuaternion(this.boatParent.quaternion);
    this.hookPosition.copy(this.boatParent.position).add(leftDirection.clone().multiplyScalar(this.lineLength));
    this.hookPosition.y = -0.5;

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
