export class Sequencer {
    constructor() {
        this.grid = {};
        this.tempo = 125;
        this.isPlaying = false;
        this.currentStep = 0;
        this.nextNoteTime = 0.0;
        this.timerID = null;
    }

    setupGrid(instruments) {
        instruments.forEach(inst => {
            if (!this.grid[inst]) this.grid[inst] = Array(16).fill(false);
        });
    }

    start(ctx, onTick) {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = ctx.currentTime + 0.05;
        this._scheduler(ctx, onTick);
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.timerID);
    }

    _scheduler(ctx, onTick) {
        while (this.nextNoteTime < ctx.currentTime + 0.1) {
            onTick(this.currentStep, this.nextNoteTime);
            this._advanceNote();
        }
        this.timerID = setTimeout(() => this._scheduler(ctx, onTick), 25);
    }

    _advanceNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += 0.25 * secondsPerBeat;
        this.currentStep = (this.currentStep + 1) % 16;
    }

    clear() {
        Object.keys(this.grid).forEach(inst => this.grid[inst].fill(false));
    }
}