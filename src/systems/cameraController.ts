import { PerspectiveCamera, Vector3 } from "three";
import { Boat } from "../entities/boat";
import { settings } from "../settings";

export class CameraController {
  private camera: PerspectiveCamera;
  private readonly offset: Vector3;
  private readonly lerpFactor: number;

  // Mouse control variables
  private isDragging = false;
  private previousMouseX = 0;
  private previousMouseY = 0;
  private orbitAngleHorizontal = 0;
  private orbitAngleVertical = 0;
  private readonly orbitSpeed = 0.005;
  private readonly returnSpeed = 0.05;

  constructor() {
    this.camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      settings.cameraNear,
      settings.cameraFar
    );

    this.offset = new Vector3(0, 2.5, 3);
    this.lerpFactor = 0.05;

    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(0, 0, 0);

    this.setupMouseControls();
  }

  private setupMouseControls() {
    window.addEventListener("pointerdown", (event) => {
      // Don't start camera drag if pointer starts on mobile controls
      if (this.isPointerOnMobileControls(event)) {
        return;
      }

      this.isDragging = true;
      this.previousMouseX = event.clientX;
      this.previousMouseY = event.clientY;
    });

    window.addEventListener("pointermove", (event) => {
      if (!this.isDragging) return;

      const deltaX = event.clientX - this.previousMouseX;
      const deltaY = event.clientY - this.previousMouseY;

      this.orbitAngleHorizontal += deltaX * this.orbitSpeed;
      this.orbitAngleVertical += deltaY * this.orbitSpeed;

      // Limit vertical angle to prevent camera flipping
      this.orbitAngleVertical = Math.max(
        -Math.PI / 3, // Look up limit
        Math.min(Math.PI / 3, this.orbitAngleVertical) // Look down limit
      );

      this.previousMouseX = event.clientX;
      this.previousMouseY = event.clientY;
    });

    window.addEventListener("pointerup", () => {
      this.isDragging = false;
    });

    // Handle touch end outside window
    window.addEventListener("pointerleave", () => {
      this.isDragging = false;
    });
  }

  private isPointerOnMobileControls(event: PointerEvent): boolean {
    const target = event.target as HTMLElement;
    if (!target) return false;

    console.log(target.closest("#nipple_0_0"));
    return (
      target.closest(".mobile-fish-button") !== null ||
      target.closest("#nipple_0_0") !== null || // nipplejs adds this attribute
      target.id === "nipple_zone_joystick"
    );
  }

  public getCamera(): PerspectiveCamera {
    return this.camera;
  }

  public handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  public update(boat: Boat) {
    const boatQuaternion = boat.getQuaternion();
    if (!boatQuaternion) return;

    // Calculate desired camera position
    const idealOffset = this.offset.clone();

    // If not dragging, gradually return to normal position
    if (!this.isDragging) {
      this.orbitAngleHorizontal *= 1 - this.returnSpeed;
      this.orbitAngleVertical *= 1 - this.returnSpeed;
    }

    // Apply orbit rotation
    idealOffset.applyAxisAngle(new Vector3(0, 1, 0), this.orbitAngleHorizontal);
    idealOffset.applyAxisAngle(new Vector3(1, 0, 0), this.orbitAngleVertical);

    // Rotate the offset by 90 degrees around Y axis to face behind the boat
    idealOffset.applyAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);
    idealOffset.applyQuaternion(boatQuaternion);
    idealOffset.add(boat.getPosition());

    // Smoothly move camera to desired position
    this.camera.position.lerp(idealOffset, this.lerpFactor);

    // Look at a point slightly above the boat
    const lookAtTarget = boat.getPosition().clone();
    lookAtTarget.y += 0.5;
    this.camera.lookAt(lookAtTarget);
  }
}
