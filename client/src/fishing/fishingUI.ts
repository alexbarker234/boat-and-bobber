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
    this.container.className = "fishing-ui-container";
    document.body.appendChild(this.container);

    // Status text
    this.statusText = document.createElement("div");
    this.statusText.className = "fishing-status-text";
    this.container.appendChild(this.statusText);

    // Rhythm game container
    this.rhythmContainer = document.createElement("div");
    this.rhythmContainer.className = "fishing-rhythm-container";
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
    const noteSpeedPixels = (trackWidth / 6) * 200;
    const hitZoneX = trackWidth * 0.167;

    // Check if mobile device
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      "ontouchstart" in window;

    // Create the main game area
    let gameHTML = `
      <h2 class="fishing-game-title">Catch the Fish!</h2>        
      <p class="fishing-instructions">
        ${
          isMobile
            ? 'Hold the <span class="green-text">Fish Button</span> during green bars, tap on <span class="gold-text">gold notes</span>!'
            : 'Hold F during <span class="green-text">green bars</span>, tap on <span class="gold-text">gold notes</span>!'
        }
      </p>
    `;

    // Progress bar
    const progressPercentage = Math.max(0, Math.min(100, gameState.progress));
    const progressColor =
      gameState.progress >= gameState.targetProgress ? "#4CAF50" : gameState.progress >= 0 ? "#FFC107" : "#F44336";

    gameHTML += `
      <div class="fishing-progress-container">
        <div class="fishing-progress-bar" style="max-width: ${trackWidth}px;">
          <div class="fishing-progress-fill" style="
            width: ${Math.abs(progressPercentage)}%;
            background: ${progressColor};
          "></div>
          <div class="fishing-progress-target" style="left: ${gameState.targetProgress}%;"></div>
        </div>
      </div>
    `;

    // Note track
    gameHTML += `
      <div class="fishing-note-track" style="
        max-width: ${trackWidth}px;
        height: ${trackHeight}px;
      ">
    `;

    // Hit zone indicator
    gameHTML += `
      <div class="fishing-hit-zone" style="left: ${(hitZoneX / trackWidth) * 100}%;"></div>
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

        let color = "#6abe30"; // Dark green
        let opacity = "0.8";

        if (note.hit) {
          color = "#4CAF50"; // Bright green
          opacity = "0.6";
        } else if (isActive && gameState.isHolding) {
          color = "#639bff"; // Blue
          opacity = "1";
        }

        if (note.type === "tap") {
          color = "#FFD700"; // Gold
          if (note.hit) {
            color = "#639bff"; // Blue
          }
        }

        // if (isActive) {
        //     color = "#fc3003";
        //   }

        const widthPos = Math.min(noteWidth, trackWidth - noteX);

        gameHTML += `
            <div class="fishing-note" style="
              left: ${noteX}px;
              width: ${widthPos}px;
              background: ${color};
              opacity: ${opacity};
            "></div>
          `;
      }
    });

    gameHTML += `</div>`;

    this.rhythmContainer.innerHTML = gameHTML;
  }

  public showResult(success: boolean) {
    this.showStatus(success ? "Success!" : "Fish Escaped!");

    setTimeout(() => {
      this.hideStatus();
    }, 3000);
  }
}
