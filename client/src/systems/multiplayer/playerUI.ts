import * as THREE from "three";

export class PlayerUI {
  private nameContainer!: HTMLDivElement;
  private playerNames = new Map<string, HTMLDivElement>();

  // Distance scaling constants
  private readonly MIN_SCALE = 0.5;
  private readonly MAX_SCALE = 1.0;
  private readonly MAX_DISTANCE = 20;
  private readonly FADE_DISTANCE = 10;

  constructor(
    private camera: THREE.Camera,
    private renderer: THREE.WebGLRenderer
  ) {
    this.setupNameContainer();
  }

  private setupNameContainer() {
    this.nameContainer = document.createElement("div");
    this.nameContainer.className = "player-name-container";
    document.body.appendChild(this.nameContainer);
  }

  public createNameElement(playerId: string, playerName: string): HTMLDivElement {
    const nameElement = document.createElement("div");
    nameElement.textContent = playerName;
    nameElement.className = "player-name";

    this.nameContainer.appendChild(nameElement);
    this.playerNames.set(playerId, nameElement);
    return nameElement;
  }

  public removeNameElement(playerId: string): void {
    const nameElement = this.playerNames.get(playerId);
    if (nameElement && this.nameContainer.contains(nameElement)) {
      this.nameContainer.removeChild(nameElement);
      this.playerNames.delete(playerId);
    }
  }

  public updateNamePosition(nameElement: HTMLDivElement, playerPosition: THREE.Vector3): void {
    const nameOffset = new THREE.Vector3(0, 1, 0);
    const worldPosition = playerPosition.clone().add(nameOffset);

    const distance = this.camera.position.distanceTo(playerPosition);

    const screenPosition = worldPosition.clone().project(this.camera);

    const canvas = this.renderer.domElement;
    const x = (screenPosition.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (screenPosition.y * -0.5 + 0.5) * canvas.clientHeight;

    const isVisible =
      screenPosition.z < 1 && x >= -100 && x <= canvas.clientWidth + 100 && y >= -50 && y <= canvas.clientHeight + 50;

    if (isVisible) {
      const normalizedDistance = Math.max(0, Math.min(1, distance / this.MAX_DISTANCE));
      const scale = this.MAX_SCALE - normalizedDistance * (this.MAX_SCALE - this.MIN_SCALE);

      let opacity = 1;
      if (distance > this.FADE_DISTANCE) {
        const fadeRange = this.MAX_DISTANCE - this.FADE_DISTANCE;
        const fadeProgress = Math.min(1, (distance - this.FADE_DISTANCE) / fadeRange);
        opacity = 1 - fadeProgress;
      }

      nameElement.style.left = `${x}px`;
      nameElement.style.top = `${y}px`;
      nameElement.style.transform = `translate(-50%, -100%) scale(${scale})`;
      nameElement.style.opacity = opacity.toString();
      nameElement.style.display = "block";
    } else {
      nameElement.style.display = "none";
    }
  }

  public cleanup(): void {
    if (this.nameContainer && this.nameContainer.parentNode) {
      this.nameContainer.parentNode.removeChild(this.nameContainer);
    }
    this.playerNames.clear();
  }
}
