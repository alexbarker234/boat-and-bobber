export interface RhythmNote {
  time: number; // When the note starts (in seconds from start)
  duration: number; // How long the note lasts (for hold notes)
  type: "hold" | "tap";
  hit: boolean;
}

export interface RhythmGameState {
  isActive: boolean;
  notes: RhythmNote[];
  currentTime: number;
  progress: number;
  targetProgress: number;
  isHolding: boolean;
}
export class RhythmGame {
  private notes: RhythmNote[] = [];
  private startTime: number = 0;
  private isActive: boolean = false;
  private progress: number = 0; // Overall progress (0-100)
  private startProgress: number = 40;
  private targetProgress: number = 80; // Need 80% to succeed
  private onComplete: ((success: boolean) => void) | null = null;
  private isHolding: boolean = false;
  private lastNoteTime: number = 0;

  public start(difficulty: "easy" | "medium" | "hard", onComplete: (success: boolean) => void) {
    this.isActive = true;
    this.startTime = Date.now();
    this.progress = this.startProgress;
    this.onComplete = onComplete;
    this.isHolding = false;
    this.lastNoteTime = 0;
    this.notes = [];

    // Set difficulty parameters
    switch (difficulty) {
      case "easy":
        this.targetProgress = 70;
        break;
      case "medium":
        this.targetProgress = 80;
        break;
      case "hard":
        this.targetProgress = 90;
        break;
    }

    this.setupKeyListeners();
    this.generateInitialNotes();
  }

  private generateInitialNotes() {
    // Generate first few notes
    for (let i = 0; i < 5; i++) {
      this.generateNextNote();
    }
  }

  private generateNextNote() {
    const lastNote = this.notes[this.notes.length - 1];
    let noteTime = 1;
    // 1-2 seconds after last note ends
    if (lastNote) {
      noteTime = lastNote.time + lastNote.duration + Math.randBetween(0.1, 0.5);
    }

    // 70% chance for hold note, 30% for tap note
    const isHoldNote = Math.random() < 0.7;

    if (isHoldNote) {
      const duration = Math.randBetween(0.3, 0.8);
      this.notes.push({
        time: noteTime,
        duration: duration,
        type: "hold",
        hit: false
      });
    } else {
      // Tap note: short duration, big reward
      this.notes.push({
        time: noteTime,
        duration: 0.2,
        type: "tap",
        hit: false
      });
    }

    this.lastNoteTime = noteTime;
  }

  private setupKeyListeners() {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!this.isActive) return;

      const key = e.key.toLowerCase();
      if (key === "f" || key === " ") {
        if (!this.isHolding) {
          this.isHolding = true;
          this.checkTapHit();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!this.isActive) return;

      const key = e.key.toLowerCase();
      if (key === "f" || key === " ") {
        this.isHolding = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Store references for cleanup
    this.keyDownHandler = handleKeyDown;
    this.keyUpHandler = handleKeyUp;
  }

  private keyDownHandler?: (e: KeyboardEvent) => void;
  private keyUpHandler?: (e: KeyboardEvent) => void;

  private checkTapHit() {
    const currentTime = (Date.now() - this.startTime) / 1000;

    for (const note of this.notes) {
      if (note.type === "tap" && !note.hit) {
        const noteStart = note.time;
        const noteEnd = note.time + note.duration;

        if (currentTime >= noteStart && currentTime <= noteEnd) {
          note.hit = true;
          this.progress += 15; // Big boost for tap notes
          break;
        }
      }
    }
  }

  public update(): RhythmGameState {
    if (!this.isActive) {
      return {
        isActive: false,
        notes: [],
        currentTime: 0,
        progress: 0,
        targetProgress: 0,
        isHolding: false
      };
    }

    const currentTime = (Date.now() - this.startTime) / 1000;

    // Generate new notes as needed
    if (currentTime > this.lastNoteTime - 5) {
      // Keep 5 seconds of notes ahead
      this.generateNextNote();
    }

    // Remove old notes that are way past
    this.notes = this.notes.filter((note) => note.time + note.duration > currentTime - 5);

    // Update progress based on current state
    this.updateProgress(currentTime);

    // Check win condition
    if (this.progress >= this.targetProgress * 2000) {
      this.end(true);
    }

    // Check lose condition (progress drops too low)
    if (this.progress <= -2000) {
      this.end(false);
    }

    return {
      isActive: this.isActive,
      notes: this.notes,
      currentTime,
      progress: this.progress,
      targetProgress: this.targetProgress,
      isHolding: this.isHolding
    };
  }

  private updateProgress(currentTime: number) {
    let progressChange = 0;
    let inValidZone = false;

    // Check if holding during a valid hold note
    if (this.isHolding) {
      for (const note of this.notes) {
        if (note.type === "hold" && !note.hit) {
          const noteStart = note.time;
          const noteEnd = note.time + note.duration;
          if (currentTime >= noteStart && currentTime <= noteEnd) {
            progressChange += 15;
            inValidZone = true;
            break;
          }
        }
      }

      // If holding outside valid zone, decrease faster
      if (!inValidZone) {
        progressChange -= 20;
      }
    }

    // Natural decay when not holding
    if (!this.isHolding) {
      progressChange -= 5;
    }

    // Apply progress change (convert from per-second to per-frame)
    this.progress += progressChange / 60;
    this.progress = Math.max(-30, Math.min(100, this.progress)); // Clamp between -30 and 100
  }

  private end(success: boolean) {
    this.isActive = false;

    // Clean up event listeners
    if (this.keyDownHandler && this.keyUpHandler) {
      window.removeEventListener("keydown", this.keyDownHandler);
      window.removeEventListener("keyup", this.keyUpHandler);
    }

    if (this.onComplete) {
      this.onComplete(success);
    }
  }

  public isGameActive(): boolean {
    return this.isActive;
  }
}
