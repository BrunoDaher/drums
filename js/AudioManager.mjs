export class AudioManager {
    constructor() {
        this.ctx = null;
        this.buffers = {};
        this.eq = null;
        this.reverb = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
            this._setupNodes();
        } else if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    _setupNodes() {
        // Equalizer
        const low = this.ctx.createBiquadFilter();
        const mid = this.ctx.createBiquadFilter();
        const high = this.ctx.createBiquadFilter();
        low.type = 'lowshelf'; low.frequency.value = 250;
        mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = 1;
        high.type = 'highshelf'; high.frequency.value = 3000;
        low.connect(mid); mid.connect(high);
        this.eq = { low, mid, high };

        // Reverb
        const convolver = this.ctx.createConvolver();
        const wet = this.ctx.createGain();
        const dry = this.ctx.createGain();
        convolver.connect(wet);
        wet.connect(this.ctx.destination);
        dry.connect(this.ctx.destination);
        
        high.connect(convolver);
        high.connect(dry);
        this.reverb = { convolver, wet, dry };
        this.updateReverbImpulse(1.2);
    }

    async loadKit(path, instruments) {
        this.init(); // Garante que o contexto e os nós (EQ/Reverb) existam antes de carregar
        const loadTasks = instruments.map(async (name) => {
            try {
                const response = await fetch(`./mp3/${path}/${name}.mp3`);
                const arrayBuffer = await response.arrayBuffer();
                this.buffers[name] = await this.ctx.decodeAudioData(arrayBuffer);
            } catch (err) {
                console.error(`Erro ao carregar sample: ${name}`, err);
            }
        });
        await Promise.all(loadTasks);
    }

    play(name, time = 0) {
        if (!this.buffers[name]) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[name];
        source.connect(this.eq.low);
        source.start(time);
    }

    updateEQ(low, mid, high) {
        if (!this.eq) return;
        this.eq.low.gain.value = low;
        this.eq.mid.gain.value = mid;
        this.eq.high.gain.value = high;
    }

    updateReverb(wet) {
        if (!this.reverb) return;
        this.reverb.wet.gain.value = wet / 100;
        this.reverb.dry.gain.value = 1 - (wet / 100);
    }

    updateReverbImpulse(duration) {
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.ctx.createBuffer(2, length, sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / duration, 2.0);
            }
        }
        this.reverb.convolver.buffer = buffer;
    }
}