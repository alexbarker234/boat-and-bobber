export class GameLoop {
  private targetFPS = 60;
  private targetFrameTime = 1000 / this.targetFPS;
  private lastTime = 0;
  private accumulator = 0;
  private isRunning = false;
  private updateIntervalId: number | null = null;
  private renderFrameId: number | null = null;
  private isTabVisible = true;

  // FPS tracking
  private frameCount = 0;
  private fpsLastTime = 0;
  private currentFPS = 0;
  private fpsUpdateInterval = 1000;

  // TPS tracking
  private tickCount = 0;
  private tpsLastTime = 0;
  private currentTPS = 0;

  constructor(
    private updateCallback: (deltaTime: number, currentTime: number) => void,
    private renderCallback: () => void
  ) {
    this.handleVisibilityChange();
  }

  private handleVisibilityChange() {
    const handleVisibilityChange = () => {
      this.isTabVisible = !document.hidden;

      if (this.isTabVisible && this.isRunning) {
        this.startRenderLoop();
      } else {
        this.stopRenderLoop();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.fpsLastTime = performance.now();
    this.tpsLastTime = performance.now();
    this.lastTime = performance.now();

    this.startUpdateLoop();
    if (this.isTabVisible) {
      this.startRenderLoop();
    }
  }

  public stop() {
    this.isRunning = false;
    this.stopUpdateLoop();
    this.stopRenderLoop();
  }

  private startUpdateLoop() {
    this.updateIntervalId = setInterval(() => {
      this.updateLoop();
    }, this.targetFrameTime) as unknown as number;
  }

  private stopUpdateLoop() {
    if (this.updateIntervalId !== null) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
  }

  private startRenderLoop() {
    if (this.renderFrameId === null) {
      this.renderLoop();
    }
  }

  private stopRenderLoop() {
    if (this.renderFrameId !== null) {
      cancelAnimationFrame(this.renderFrameId);
      this.renderFrameId = null;
    }
  }

  private updateLoop() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.accumulator += deltaTime;

    // Fixed timestep updates
    const maxIterations = 10;
    let iterations = 0;
    while (this.accumulator >= this.targetFrameTime && iterations < maxIterations) {
      this.updateCallback(this.targetFrameTime / 1000, currentTime);
      this.accumulator -= this.targetFrameTime;
      this.tickCount++;
      iterations++;
    }

    // TPS calculation
    if (currentTime - this.tpsLastTime >= this.fpsUpdateInterval) {
      this.currentTPS = Math.round((this.tickCount * 1000) / (currentTime - this.tpsLastTime));
      this.tickCount = 0;
      this.tpsLastTime = currentTime;
    }
  }

  private renderLoop = () => {
    if (!this.isRunning || !this.isTabVisible) {
      this.renderFrameId = null;
      return;
    }

    this.renderCallback();

    // FPS calculation
    const currentTime = performance.now();
    this.frameCount++;
    if (currentTime - this.fpsLastTime >= this.fpsUpdateInterval) {
      this.currentFPS = Math.round((this.frameCount * 1000) / (currentTime - this.fpsLastTime));
      this.frameCount = 0;
      this.fpsLastTime = currentTime;
    }

    this.renderFrameId = requestAnimationFrame(this.renderLoop);
  };

  public getCurrentFPS(): number {
    return this.currentFPS;
  }

  public getCurrentTPS(): number {
    return this.currentTPS;
  }
}
