export interface RhythmNote {
  time: number; // When the note should be hit (in seconds from start)
  key: "w" | "a" | "s" | "d";
  hit: boolean;
}

export class RhythmGame {
  private notes: RhythmNote[] = [];
  private startTime: number = 0;
  private duration: number = 5; // 5 seconds
  private isActive: boolean = false;
  private score: number = 0;
  private totalNotes: number = 0;
  private onComplete: ((success: boolean) => void) | null = null;

  public start(difficulty: "easy" | "medium" | "hard", onComplete: (success: boolean) => void) {
    this.isActive = true;
    this.startTime = Date.now();
    this.score = 0;
    this.onComplete = onComplete;
    this.generateNotes(difficulty);
    this.setupKeyListeners();
  }

  private generateNotes(difficulty: "easy" | "medium" | "hard") {
    this.notes = [];
    const keys: Array<RhythmNote["key"]> = ["w", "a", "s", "d"];

    let noteCount: number;
    let minInterval: number;

    switch (difficulty) {
      case "easy":
        noteCount = 8;
        minInterval = 0.5;
        break;
      case "medium":
        noteCount = 12;
        minInterval = 0.3;
        break;
      case "hard":
        noteCount = 16;
        minInterval = 0.2;
        break;
    }

    this.totalNotes = noteCount;

    for (let i = 0; i < noteCount; i++) {
      const time = (i + 1) * (this.duration / (noteCount + 1));
      const key = keys[Math.floor(Math.random() * keys.length)];

      this.notes.push({
        time,
        key,
        hit: false
      });
    }

    // Sort by time
    this.notes.sort((a, b) => a.time - b.time);
  }

  private setupKeyListeners() {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!this.isActive) return;

      const key = e.key.toLowerCase() as RhythmNote["key"];
      if (["w", "a", "s", "d"].includes(key)) {
        this.checkHit(key);
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    // Clean up listener when game ends
    setTimeout(
      () => {
        window.removeEventListener("keydown", handleKeyPress);
      },
      this.duration * 1000 + 1000
    );
  }

  private checkHit(key: RhythmNote["key"]) {
    const currentTime = (Date.now() - this.startTime) / 1000;
    const hitWindow = 0.3; // 300ms window for hitting notes

    for (const note of this.notes) {
      if (note.hit) continue;
      if (note.key !== key) continue;

      const timeDiff = Math.abs(currentTime - note.time);
      if (timeDiff <= hitWindow) {
        note.hit = true;
        this.score++;
        break;
      }
    }
  }

  public update(): { isActive: boolean; notes: RhythmNote[]; currentTime: number; score: number; totalNotes: number } {
    if (!this.isActive) {
      return { isActive: false, notes: [], currentTime: 0, score: 0, totalNotes: 0 };
    }

    const currentTime = (Date.now() - this.startTime) / 1000;

    if (currentTime >= this.duration) {
      this.end();
    }

    return {
      isActive: this.isActive,
      notes: this.notes,
      currentTime,
      score: this.score,
      totalNotes: this.totalNotes
    };
  }

  private end() {
    this.isActive = false;
    const successRate = this.score / this.totalNotes;
    const success = successRate >= 0.7; // Need 70% accuracy to succeed

    if (this.onComplete) {
      this.onComplete(success);
    }
  }

  public isGameActive(): boolean {
    return this.isActive;
  }
}
