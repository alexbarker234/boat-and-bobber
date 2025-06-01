export class GameLoop {
  private targetFPS = 60;
  private targetFrameTime = 1000 / this.targetFPS;
  private lastTime = 0;
  private accumulator = 0;
  private isRunning = false;

  // FPS tracking
  private frameCount = 0;
  private fpsLastTime = 0;
  private currentFPS = 0;
  private fpsUpdateInterval = 1000; // Update FPS display every second

  // TPS tracking
  private tickCount = 0;
  private tpsLastTime = 0;
  private currentTPS = 0;

  constructor(
    private updateCallback: (deltaTime: number, currentTime: number) => void,
    private renderCallback: () => void
  ) {}

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.fpsLastTime = performance.now();
    this.tpsLastTime = performance.now();
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  public stop() {
    this.isRunning = false;
  }

  public getCurrentFPS(): number {
    return this.currentFPS;
  }

  public getCurrentTPS(): number {
    return this.currentTPS;
  }

  private gameLoop = (currentTime: number) => {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.accumulator += deltaTime;

    // Fixed timestep updates
    const maxIterations = 1000;
    let iterations = 0;
    while (this.accumulator >= this.targetFrameTime) {
      this.updateCallback(this.targetFrameTime / 1000, currentTime);
      this.accumulator -= this.targetFrameTime;

      this.tickCount++;
      iterations++;

      if (iterations >= maxIterations) {
        alert("Game loop exceeded maximum iterations. Reloading...");
        window.location.reload();
        return;
      }
    }

    this.renderCallback();

    // FPS calculation
    this.frameCount++;
    if (currentTime - this.fpsLastTime >= this.fpsUpdateInterval) {
      this.currentFPS = Math.round((this.frameCount * 1000) / (currentTime - this.fpsLastTime));
      this.frameCount = 0;
      this.fpsLastTime = currentTime;
    }

    // TPS calculation
    if (currentTime - this.tpsLastTime >= this.fpsUpdateInterval) {
      this.currentTPS = Math.round((this.tickCount * 1000) / (currentTime - this.tpsLastTime));
      this.tickCount = 0;
      this.tpsLastTime = currentTime;
    }

    requestAnimationFrame(this.gameLoop);
  };
}
