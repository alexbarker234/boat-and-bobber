export class GameLoop {
  private targetFPS = 60;
  private targetFrameTime = 1000 / this.targetFPS;
  private lastTime = 0;
  private accumulator = 0;
  private isRunning = false;

  constructor(
    private updateCallback: (deltaTime: number, currentTime: number) => void,
    private renderCallback: () => void
  ) {}

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  public stop() {
    this.isRunning = false;
  }

  private gameLoop = (currentTime: number) => {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.accumulator += deltaTime;

    // Fixed timestep updates
    while (this.accumulator >= this.targetFrameTime) {
      this.updateCallback(this.targetFrameTime / 1000, currentTime); // Convert to seconds
      this.accumulator -= this.targetFrameTime;
    }

    // Render
    this.renderCallback();

    requestAnimationFrame(this.gameLoop);
  };
}
