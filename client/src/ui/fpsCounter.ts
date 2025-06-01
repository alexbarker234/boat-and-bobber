import "../styles/performanceCounter.css";

export class FPSCounter {
  private container: HTMLDivElement;
  private fpsDisplay: HTMLSpanElement;
  private tpsDisplay: HTMLSpanElement;

  constructor() {
    // Create container
    this.container = document.createElement("div");
    this.container.className = "performance-counter";

    // Create FPS display
    this.fpsDisplay = document.createElement("span");
    this.fpsDisplay.className = "fps-display";
    this.fpsDisplay.textContent = "FPS: --";

    // Create TPS display
    this.tpsDisplay = document.createElement("span");
    this.tpsDisplay.className = "tps-display";
    this.tpsDisplay.textContent = "TPS: --";

    // Append elements
    this.container.appendChild(this.fpsDisplay);
    this.container.appendChild(this.tpsDisplay);
    document.body.appendChild(this.container);
  }

  public update(fps: number, tps: number): void {
    // Update FPS
    this.fpsDisplay.textContent = `FPS: ${fps}`;

    // Remove existing performance classes for FPS
    this.fpsDisplay.classList.remove("good", "moderate", "poor");

    // Add performance class for FPS
    if (fps >= 55) {
      this.fpsDisplay.classList.add("good");
    } else if (fps >= 30) {
      this.fpsDisplay.classList.add("moderate");
    } else {
      this.fpsDisplay.classList.add("poor");
    }

    // Update TPS
    this.tpsDisplay.textContent = `TPS: ${tps}`;

    // Remove existing performance classes for TPS
    this.tpsDisplay.classList.remove("good", "moderate", "poor");

    // Add performance class for TPS
    if (tps >= 58) {
      this.tpsDisplay.classList.add("good");
    } else if (tps >= 45) {
      this.tpsDisplay.classList.add("moderate");
    } else {
      this.tpsDisplay.classList.add("poor");
    }
  }

  public destroy(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
