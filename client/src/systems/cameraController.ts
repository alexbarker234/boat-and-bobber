import { PerspectiveCamera, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Boat } from "../entities/boat";
import { settings } from "../settings";

export class CameraController {
  private camera: PerspectiveCamera;
  private controls: OrbitControls;
  private readonly offset: Vector3;
  private readonly lerpFactor: number;
  private target: Vector3;
  private isDragging = false;
  private underwaterOverlay!: HTMLElement;

  constructor(renderer: WebGLRenderer) {
    this.camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      settings.cameraNear,
      settings.cameraFar
    );

    this.offset = new Vector3(0, 2.5, 3);
    this.lerpFactor = 0.02;
    this.target = new Vector3(0, 0, 0);

    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.setupOrbitControls();

    this.createUnderwaterOverlay();
  }

  private setupOrbitControls() {
    // Configure OrbitControls
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = false; // Disable zoom to maintain fixed distance
    this.controls.enablePan = false; // Disable panning

    // Limit vertical rotation
    this.controls.minPolarAngle = Math.degreesToRadians(30);
    this.controls.maxPolarAngle = Math.degreesToRadians(80); // no underwater

    // Set distance limits (effectively disabling zoom)
    this.controls.minDistance = 5;
    this.controls.maxDistance = 5;

    // Track dragging state
    this.controls.addEventListener("start", () => {
      this.isDragging = true;
    });

    this.controls.addEventListener("end", () => {
      this.isDragging = false;
    });

    // Disable controls when pointer is on mobile controls
    this.controls.domElement?.addEventListener("pointerdown", (event) => {
      if (this.isPointerOnMobileControls(event)) {
        this.controls.enabled = false;
        // Re-enable after a short delay to allow the mobile control to handle the event
        setTimeout(() => {
          this.controls.enabled = true;
        }, 100);
      }
    });
  }

  private isPointerOnMobileControls(event: PointerEvent): boolean {
    const target = event.target as HTMLElement;
    if (!target) return false;

    return (
      target.closest(".mobile-fish-button") !== null ||
      target.closest("#nipple_0_0") !== null ||
      target.id === "nipple_zone_joystick"
    );
  }

  private createUnderwaterOverlay() {
    this.underwaterOverlay = document.createElement("div");
    this.underwaterOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 100, 200, 0.9);
      pointer-events: none;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(this.underwaterOverlay);
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

    const boatPosition = boat.getPosition();

    // Calculate desired camera position based on boat's orientation
    const idealOffset = this.offset.clone();

    // Rotate the offset by 90 degrees around Z axis to face behind the boat
    idealOffset.applyAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);
    idealOffset.applyQuaternion(boatQuaternion);

    // If the boat is fishing, adjust the camera to look slightly to the left
    if (boat.isFishing()) {
      const leftOffset = new Vector3(0, -2, 0);
      leftOffset.applyQuaternion(boatQuaternion);
      idealOffset.add(leftOffset);
    }

    const idealPosition = boatPosition.clone().add(idealOffset);

    // Smoothly move target position (what the camera orbits around)
    const lookAtTarget = boatPosition.clone();
    this.target.lerp(lookAtTarget, this.lerpFactor);

    this.controls.target.copy(this.target);
    if (!this.isDragging) {
      this.camera.position.lerp(idealPosition, this.lerpFactor);
    }

    // Check if camera is underwater (assuming water level is at y = 0)
    const isUnderwater = this.camera.position.y < 0;
    this.underwaterOverlay.style.opacity = isUnderwater ? "1" : "0";

    // Always update controls
    this.controls.update();
  }

  public dispose() {
    this.controls.dispose();
    if (this.underwaterOverlay && this.underwaterOverlay.parentNode) {
      this.underwaterOverlay.parentNode.removeChild(this.underwaterOverlay);
    }
  }
}
