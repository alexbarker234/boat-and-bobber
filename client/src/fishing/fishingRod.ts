import * as THREE from "three";
import {
  BufferGeometry,
  CylinderGeometry,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  TextureLoader,
  Vector3
} from "three";
import { Boat } from "../entities/boat";

export class FishingRod {
  private rodMesh!: Mesh;
  private lineMesh: Line | null = null;
  private hookPosition: Vector3 = new Vector3();
  private isLineOut = false;
  private lineLength = 0;
  private maxLineLength = 2;
  private castSpeed = 0.1;

  private rodLength = 0.8;

  private boatParent: Boat;

  private fishMesh: Mesh | null = null;
  private fishOffset = 0;

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

    // // Update fish position if it exists
    // if (this.fishMesh) {
    //   this.fishMesh.position.copy(this.hookPosition);
    //   this.fishMesh.position.y = 0.01;
    // }
  }

  public updateCasting(): boolean {
    if (!this.isLineOut || this.lineLength >= this.maxLineLength) {
      return this.lineLength >= this.maxLineLength;
    }

    this.lineLength += this.castSpeed;

    // Update hook position - cast to the left of the boat
    const leftDirection = new Vector3(0, 1, 0).applyQuaternion(this.boatParent.quaternion);
    this.hookPosition.copy(this.boatParent.position).add(leftDirection.clone().multiplyScalar(this.lineLength));
    this.hookPosition.y = -0.001;

    return false; // Still casting
  }

  public reelIn() {
    this.isLineOut = false;
    this.lineLength = 0;
    if (this.lineMesh) {
      this.lineMesh.removeFromParent();
      this.lineMesh = null;
    }
    this.removeFish();
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

  public createFishMesh() {
    if (this.fishMesh) {
      this.removeFish();
    }
    const fishSize = 0.5;
    const fishGeometry = new PlaneGeometry(fishSize, fishSize);

    // TODO use asset manager
    const textureLoader = new TextureLoader();
    const fishTexture = textureLoader.load(`./assets/FishSilhouette.png`);

    const fishMaterial = new MeshBasicMaterial({
      map: fishTexture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });
    const debugMaterial = new MeshBasicMaterial({ color: 0xff0000 });
    this.fishMesh = new Mesh(fishGeometry, fishMaterial);

    // Set the rotation pivot to the top-left corner
    fishGeometry.translate(fishSize / 2, -fishSize / 2, 0);

    this.fishMesh.position.copy(this.hookPosition);
    this.fishMesh.position.y = 0.001;

    this.fishMesh.rotation.x = -Math.PI / 2;
    this.fishMesh.rotation.z = Math.random() * Math.PI * 2;
  }

  // TODO fix this
  public updateFishSilhouette(isOnHook: boolean) {
    if (!this.fishMesh) return;

    if (isOnHook) {
      // Create a biting motion - move back and forth in the direction the fish is facing
      const time = Date.now() * 0.005; // Control speed of movement
      const amplitude = 0.2; // How far to move

      // Get the current rotation to determine facing direction
      const rotation = this.fishMesh.rotation.z;

      // Calculate movement in the direction the fish is facing (based on z rotation)
      // shit fucking doesnt work though
      const oscillation = (Math.sin(time) * 0.5 - 0.5) * amplitude;
      console.log(oscillation);
      const facingX = Math.cos(rotation) * oscillation;
      const facingZ = Math.sin(rotation) * oscillation;

      this.fishMesh.position.copy(this.hookPosition);
      this.fishMesh.position.x += facingX;
      this.fishMesh.position.z += facingZ;
      this.fishMesh.position.y = 0.001;

      // Add slight rotation wobble
      this.fishMesh.rotation.z += 0.01;
      // this.fishMesh.rotation.z = this.fishMesh.rotation.z + Math.sin(time * 2) * 0.01;
    } else {
      // Return to static position
      this.fishMesh.position.copy(this.hookPosition);
      this.fishMesh.position.y = 0.01;
      this.fishMesh.rotation.z = 0;
    }
  }

  public removeFish() {
    if (this.fishMesh) {
      this.fishMesh.removeFromParent();
      this.fishMesh = null;
    }
  }

  public getFishMesh(): Mesh | null {
    return this.fishMesh;
  }
}
