 export class Audio {
   
    constructor(x) {

        
        this.audioContext = new AudioContext();
        this.sustain = 0.01;
        console.log('Web Audio initialized');
    }

    fx(event) {
        let el = event.srcElement;
        el.setAttribute('value', el.getAttribute('value') == 'true' ? false : true);
        el.classList.toggle('active');
    }

    playNote(frequency, type) {
        const ctx = this.audioContext;
        if (ctx) {
            const now = ctx.currentTime;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            let eq = this.equalizer(ctx);

            let btnChorus = document.getElementById('chorus');
            let btnReverb = document.getElementById('reverb');
            let btnDelay = document.getElementById('delay');

            if (btnChorus && btnChorus.getAttribute('value') == 'true') {
                this.conectChorus(ctx, type, frequency, now, eq);
            }
            if (btnReverb && btnReverb.getAttribute('value') == 'true') {
                this.conectReverb(ctx, type, frequency, now, eq);
            }
            if (btnDelay && btnDelay.getAttribute('value') == 'true') {
                this.conectDelay(ctx, type, frequency, now, eq);
            }

            oscillator.type = type;
            oscillator.frequency.value = frequency;

            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(this.sustain, now + 1.5);

            oscillator.connect(gainNode);
            gainNode.connect(eq.low);
            eq.low.connect(eq.mid);
            eq.mid.connect(eq.high);
            eq.high.connect(ctx.destination);

            oscillator.start(now);
            oscillator.stop(now + 1);
        }
    }

    // Dummy equalizer method (replace with your actual implementation)
    equalizer(ctx) {
        return {
            low: ctx.createBiquadFilter(),
            mid: ctx.createBiquadFilter(),
            high: ctx.createBiquadFilter()
        };
    }

    // Dummy effect methods (replace with your actual implementation)
   // conectChorus() {}
    //conectReverb() {}
    //conectDelay() {}
}

// Exemplo de uso:
// const drum = new DrumMachine();
// drum.playCaixa();
export default Audio;