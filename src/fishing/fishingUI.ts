import { RhythmNote } from "./rhythmGame";

export class FishingUI {
  private container!: HTMLDivElement;
  private rhythmContainer!: HTMLDivElement;
  private statusText!: HTMLDivElement;

  constructor() {
    this.createUI();
  }

  private createUI() {
    // Main container
    this.container = document.createElement("div");
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 18px;
      z-index: 1000;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);

    // Status text
    this.statusText = document.createElement("div");
    this.statusText.style.cssText = `
      background: rgba(0, 0, 0, 0.7);
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 10px;
    `;
    this.container.appendChild(this.statusText);

    // Rhythm game container
    this.rhythmContainer = document.createElement("div");
    this.rhythmContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      padding: 20px;
      border-radius: 10px;
      display: none;
      min-width: 400px;
      text-align: center;
    `;
    document.body.appendChild(this.rhythmContainer);
  }

  public showStatus(text: string) {
    this.statusText.textContent = text;
    this.statusText.style.display = "block";
  }

  public hideStatus() {
    this.statusText.style.display = "none";
  }

  public showRhythmGame(gameState: {
    isActive: boolean;
    notes: RhythmNote[];
    currentTime: number;
    score: number;
    totalNotes: number;
  }) {
    if (!gameState.isActive) {
      this.rhythmContainer.style.display = "none";
      return;
    }

    this.rhythmContainer.style.display = "block";

    const progressBar = `
      <div style="width: 100%; height: 20px; background: #333; border-radius: 10px; margin: 20px 0;">
        <div style="width: ${(gameState.currentTime / 5) * 100}%; height: 100%; background: #4CAF50; border-radius: 10px;"></div>
      </div>
    `;

    const notesDisplay = gameState.notes
      .map((note) => {
        const timeDiff = note.time - gameState.currentTime;
        const isActive = Math.abs(timeDiff) < 0.3;
        const isPast = timeDiff < -0.3;

        let color = "#666";
        if (note.hit) color = "#4CAF50";
        else if (isActive) color = "#FFC107";
        else if (isPast) color = "#F44336";

        return `
        <div style="
          display: inline-block;
          margin: 5px;
          padding: 10px 15px;
          background: ${color};
          border-radius: 5px;
          font-weight: bold;
          text-transform: uppercase;
        ">
          ${note.key}
        </div>
      `;
      })
      .join("");

    this.rhythmContainer.innerHTML = `
      <h2>Catch the Fish!</h2>
      <p>Press the keys when they light up!</p>
      ${progressBar}
      <div style="margin: 20px 0;">
        ${notesDisplay}
      </div>
      <p>Score: ${gameState.score}/${gameState.totalNotes}</p>
    `;
  }

  public showResult(success: boolean, fishType?: string) {
    this.rhythmContainer.innerHTML = `
      <h2>${success ? "Success!" : "Fish Escaped!"}</h2>
      ${success ? `<p>You caught a ${fishType} fish!</p>` : "<p>Better luck next time!</p>"}
      <p>Click to continue...</p>
    `;

    setTimeout(() => {
      this.rhythmContainer.style.display = "none";
    }, 3000);
  }
}
