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
      font-family: Arial, sans-serif;
      font-size: clamp(14px, 2vw, 18px);
      z-index: 1000;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);

    // Status text
    this.statusText = document.createElement("div");
    this.statusText.style.cssText = `
      background: rgba(0, 0, 0, 0.7);
      padding: clamp(8px, 1vw, 10px);
      border-radius: 5px;
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
      border-radius: 15px;
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
    const noteSpeed = trackWidth / 6; // Relative to track width
    const hitZoneX = trackWidth * 0.167; // 16.7% from left (100/600 = 0.167)

    // Create the main game area
    let gameHTML = `
      <h2 style="margin-bottom: clamp(15px, 2vh, 20px); color: #4CAF50; font-size: clamp(18px, 3vw, 24px);">Catch the Fish!</h2>
      <p style="margin-bottom: clamp(15px, 2vh, 20px); font-size: clamp(14px, 2vw, 16px);">
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
          border-radius: 10px;
          margin: 0 auto;
          position: relative;
          border: 2px solid #666;
        ">
          <div style="
            width: ${Math.abs(progressPercentage)}%;
            height: 100%;
            background: ${progressColor};
            border-radius: 8px;
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
        background: linear-gradient(to right, #222 0%, #333 ${(hitZoneX / trackWidth) * 100}%, #444 ${(hitZoneX / trackWidth) * 100}%, #333 100%);
        border: 2px solid #666;
        border-radius: 10px;
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
        box-shadow: 0 0 5px white;
      "></div>
    `;

    console.log(gameState.isHolding);

    // Render notes (convert ticks to seconds for display)
    gameState.notes.forEach((note) => {
      const timeUntilNote = (note.time - gameState.currentTime) / 60; // Convert ticks to seconds
      const noteX = hitZoneX + timeUntilNote * noteSpeed * 100; // TODO figure out how to position correctly
      const noteDurationSeconds = note.duration; // Convert duration to seconds

      // Only render notes that are visible
      if (noteX > -trackWidth * 0.2 && noteX < trackWidth * 1.2) {
        if (note.type === "hold") {
          const noteWidth = noteDurationSeconds * noteSpeed;
          const isActive = timeUntilNote <= 0 && timeUntilNote >= -noteDurationSeconds;

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

          const widthPos = Math.min(noteWidth, trackWidth - noteX);

          gameHTML += `
            <div style="
              position: absolute;
              left: ${noteX}px;
              top: ${trackHeight * 0.1}px;
              width: ${widthPos}px;
              height: ${trackHeight * 0.8}px;
              background: ${color};
              opacity: ${opacity};
              border-radius: 5px;
              border: 2px solid #4CAF50;
            "></div>
          `;
        } else if (note.type === "tap") {
          const isActive = timeUntilNote <= 0 && timeUntilNote >= -noteDurationSeconds;

          let color = "#FFD700"; // Gold
          let scale = "1";

          if (note.hit) {
            color = "#fc3003"; // Light gold
            scale = "0.8";
          } else if (isActive) {
            color = "#FFEB3B"; // Bright gold
            scale = "1.2";
          }

          const noteSize = trackHeight * 0.6;
          const leftPos = noteX - noteSize / 2;

          gameHTML += `
            <div style="
              position: absolute;
              left: ${leftPos}px;
              top: ${trackHeight * 0.2}px;
              width: ${noteSize}px;
              height: ${noteSize}px;
              background: ${color};
              border-radius: 50%;
              border: 3px solid #FF8F00;
              transform: scale(${scale});
              transition: transform 0.1s ease;
              box-shadow: 0 0 10px ${color};
            "></div>
          `;
        }
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
