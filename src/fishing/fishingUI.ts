import { RhythmGameState } from "./rhythmGame";

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
      top: 2vh;
      left: 2vw;
      color: white;
      z-index: 1000;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);

    // Status text
    this.statusText = document.createElement("div");
    this.statusText.style.cssText = `
      background: rgba(0, 0, 0, 0.7);
      padding: clamp(8px, 1vw, 10px);
      margin-bottom: clamp(8px, 1vw, 10px);
    `;
    this.container.appendChild(this.statusText);

    // Rhythm game container
    this.rhythmContainer = document.createElement("div");
    this.rhythmContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      padding: clamp(20px, 3vw, 30px);
      display: none;
      width: min(90vw, 700px);
      max-width: 90vw;
      text-align: center;
      border: 3px solid #4CAF50;
      box-sizing: border-box;
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

  public showRhythmGame(gameState: RhythmGameState) {
    if (!gameState.isActive) {
      this.rhythmContainer.style.display = "none";
      return;
    }

    this.rhythmContainer.style.display = "block";

    const trackWidth = Math.min(600, window.innerWidth * 0.8);
    const trackHeight = Math.max(80, Math.min(100, window.innerHeight * 0.12));
    const noteSpeedPixels = (trackWidth / 6) * 200; // Relative to track width
    const hitZoneX = trackWidth * 0.167; // 16.7% from left (100/600 = 0.167)

    // Create the main game area
    let gameHTML = `
      <h2 style="margin-bottom: clamp(15px, 2vh, 20px); color: #4CAF50; font-size: clamp(18px, 3vw, 24px);">Catch the Fish!</h2>        
      <p style="margin-bottom: clamp(15px, 2vh, 20px); font-size: clamp(14px, 2vw, 16px); color: white;">
        Hold F/SPACE during <span style="color: #4CAF50;">green bars</span>, 
        tap on <span style="color: #FFD700;">gold notes</span>!
      </p>
    `;

    // Progress bar
    const progressPercentage = Math.max(0, Math.min(100, gameState.progress));
    const progressColor =
      gameState.progress >= gameState.targetProgress ? "#4CAF50" : gameState.progress >= 0 ? "#FFC107" : "#F44336";

    gameHTML += `
      <div style="margin-bottom: clamp(15px, 2vh, 20px);">
        <div style="
          width: 100%;
          max-width: ${trackWidth}px;
          height: clamp(16px, 2vh, 20px);
          background: #333;
          margin: 0 auto;
          position: relative;
          border: 2px solid #666;
        ">
          <div style="
            width: ${Math.abs(progressPercentage)}%;
            height: 100%;
            background: ${progressColor};
            transition: width 0.1s ease;
          "></div>
          <div style="
            position: absolute;
            left: ${gameState.targetProgress}%;
            top: -25%;
            width: 2px;
            height: 150%;
            background: white;
            box-shadow: 0 0 5px white;
          "></div>
        </div>
        <p style="margin: clamp(8px, 1vh, 10px) 0; font-size: clamp(14px, 2vw, 16px);">
          Progress: ${Math.round(progressPercentage)}% / ${gameState.targetProgress}%
        </p>
      </div>
    `;

    // Note track
    gameHTML += `
      <div style="
        position: relative;
        width: 100%;
        max-width: ${trackWidth}px;
        height: ${trackHeight}px;
        background-color: #333;
        border: 2px solid #666;
        margin: clamp(15px, 2vh, 20px) auto;
        overflow: hidden;
      ">
    `;

    // Hit zone indicator
    gameHTML += `
      <div style="
        position: absolute;
        left: ${(hitZoneX / trackWidth) * 100}%;
        top: 0;
        width: 2px;
        height: 100%;
        background: white;
      "></div>
    `;

    // Render notes (convert ticks to seconds for display)
    gameState.notes.forEach((note) => {
      const timeUntilNote = (note.time - gameState.currentTime) / 60;
      const timeUntilEndNote = (note.time + note.duration - gameState.currentTime) / 60;

      const noteX = hitZoneX + timeUntilNote * noteSpeedPixels;
      const noteEndX = hitZoneX + timeUntilEndNote * noteSpeedPixels;
      const noteWidth = noteEndX - noteX;

      if (noteEndX > -trackWidth * 0.2 && noteX < trackWidth * 1.2) {
        const isActive = timeUntilNote <= 0 && timeUntilNote >= -note.duration;

        let color = "#2E7D32"; // Dark green
        let opacity = "0.8";

        if (note.hit) {
          color = "#4CAF50"; // Bright green
          opacity = "0.6";
        } else if (isActive && gameState.isHolding) {
          color = "#fc3003"; // Medium green
          opacity = "1";
        } else if (isActive) {
          color = "#4CAF50"; // Bright green
          opacity = "0.9";
        }

        if (note.type === "tap") {
          color = "#FFD700";
          if (note.hit) {
            color = "#fc3003"; // Light gold
          } else if (isActive) {
            color = "#FFEB3B"; // Bright gold
          }
        }

        const widthPos = Math.min(noteWidth, trackWidth - noteX);

        gameHTML += `
            <div style="
              position: absolute;
              left: ${noteX}px;
              top: 0px;
              width: ${widthPos}px;
              height: 100%;
              background: ${color};
              opacity: ${opacity};
            "></div>
          `;
      }
    });

    gameHTML += `</div>`;

    // Instructions
    gameHTML += `
      <div style="margin-top: 20px; font-size: 14px; color: #999;">
        <p>Hold F/SPACE during green bars • Tap on gold notes • Don't hold outside zones!</p>
        <p style="color: ${gameState.isHolding ? "#4CAF50" : "#666"};">
          ${gameState.isHolding ? "HOLDING" : "NOT HOLDING"}
        </p>
      </div>
    `;

    this.rhythmContainer.innerHTML = gameHTML;
  }

  public showResult(success: boolean, fishType?: string) {
    this.rhythmContainer.innerHTML = `
      <h2 style="color: ${success ? "#4CAF50" : "#F44336"};">
        ${success ? "Success!" : "Fish Escaped!"}
      </h2>
      ${success ? `<p style="font-size: 18px; margin: 20px 0;">You caught a <strong>${fishType}</strong> fish!</p>` : "<p style='font-size: 18px; margin: 20px 0;'>Better luck next time!</p>"}
      <p style="font-size: 14px; color: #999;">Click to continue...</p>
    `;

    setTimeout(() => {
      this.rhythmContainer.style.display = "none";
    }, 3000);
  }
}
