const keyToInstrument = {
    a: 'caixa',
    l: 'caixa',
    c: 'bumbo',
    k: 'chimbau',
    i: 'chimbauA',
    o: 'crash',
    p: 'ataque',
    ',': 'conducao',
    '.': 'sino',
    n: 'surdo',
    m: 'tom',
    z: 'bloco'
};

let audioContext;
let eqNodes;
let reverbNodes;

function createAudioContext() {
    if (!audioContext) {
        audioContext = window._safariAudioContext || new (window.AudioContext || window.webkitAudioContext)();
        window._safariAudioContext = audioContext;
    }
    return audioContext;
}

function createImpulseResponse(ctx, duration = 1.2, decay = 2.0) {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / duration, decay);
        }
    }
    return buffer;
}

function createEqualizer(ctx) {
    if (eqNodes) return eqNodes;

    const low = ctx.createBiquadFilter();
    const mid = ctx.createBiquadFilter();
    const high = ctx.createBiquadFilter();

    low.type = 'lowshelf';
    low.frequency.value = 250;
    low.gain.value = 0;

    mid.type = 'peaking';
    mid.frequency.value = 1000;
    mid.Q.value = 1;
    mid.gain.value = 0;

    high.type = 'highshelf';
    high.frequency.value = 3000;
    high.gain.value = 0;

    low.connect(mid);
    mid.connect(high);

    eqNodes = { low, mid, high };
    return eqNodes;
}

function createReverb(ctx, eqOutput) {
    if (!reverbNodes) {
        const convolver = ctx.createConvolver();
        const wetGain = ctx.createGain();
        const dryGain = ctx.createGain();

        convolver.connect(wetGain);
        wetGain.connect(ctx.destination);
        dryGain.connect(ctx.destination);

        const duration = Number(document.getElementById('reverbDuration')?.value || 1.2);
        convolver.buffer = createImpulseResponse(ctx, duration, 2.0);
        wetGain.gain.value = 0;
        dryGain.gain.value = 1;

        reverbNodes = { convolver, wetGain, dryGain, duration, connected: false };
    }

    if (eqOutput && !reverbNodes.connected) {
        eqOutput.connect(reverbNodes.convolver);
        eqOutput.connect(reverbNodes.dryGain);
        reverbNodes.connected = true;
    }

    return reverbNodes;
}

function updateEqValues() {
    if (!eqNodes) return;

    const lowGain = Number(document.getElementById('lowGain')?.value || 0);
    const midGain = Number(document.getElementById('midGain')?.value || 0);
    const highGain = Number(document.getElementById('highGain')?.value || 0);

    eqNodes.low.gain.value = lowGain;
    eqNodes.mid.gain.value = midGain;
    eqNodes.high.gain.value = highGain;

    document.getElementById('lowValue').innerText = lowGain;
    document.getElementById('midValue').innerText = midGain;
    document.getElementById('highValue').innerText = highGain;
}

function updateReverbValues() {
    if (!reverbNodes) return;

    const wetValue = Number(document.getElementById('reverbWet')?.value || 0);
    const durationValue = Number(document.getElementById('reverbDuration')?.value || 1.2);

    if (reverbNodes.duration !== durationValue) {
        reverbNodes.convolver.buffer = createImpulseResponse(audioContext, durationValue, 2.0);
        reverbNodes.duration = durationValue;
    }

    reverbNodes.wetGain.gain.value = wetValue / 100;
    reverbNodes.dryGain.gain.value = 1 - wetValue / 100;

    document.getElementById('reverbWetValue').innerText = wetValue;
    document.getElementById('reverbDurationValue').innerText = durationValue.toFixed(1);
}

function updateControlValues() {
    updateEqValues();
    updateReverbValues();
}

function animateButton(selector) {
    const el = document.getElementById(selector);
    if (!el) return;
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 100);
}

function play(audioUrl) {
    const ctx = createAudioContext();
    const eq = createEqualizer(ctx);
    const reverb = createReverb(ctx, eq.high);
    updateControlValues();

    fetch(audioUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(eq.low);
            source.start(0);
        })
        .catch(err => {
            const audioElement = new window.Audio(audioUrl);
            audioElement.currentTime = 0;
            audioElement.play();
        });
}

function playInstrument(name) {
    animateButton(name);
    play(`./mp3/${name}.mp3`);
}

function initEqControls() {
    ['low', 'mid', 'high'].forEach((band) => {
        const input = document.getElementById(`${band}Gain`);
        if (input) {
            input.addEventListener('input', updateControlValues);
        }
    });

    const reverbWet = document.getElementById('reverbWet');
    const reverbDuration = document.getElementById('reverbDuration');
    if (reverbWet) reverbWet.addEventListener('input', updateControlValues);
    if (reverbDuration) reverbDuration.addEventListener('input', updateControlValues);

    updateControlValues();
}

function setupInputHandlers() {
    if (!/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        document.addEventListener('keydown', (event) => {
            const instrument = keyToInstrument[event.key.toLowerCase()];
            if (instrument) {
                playInstrument(instrument);
            }
        });

        document.querySelectorAll('.drum').forEach((el) => {
            el.addEventListener('click', () => {
                playInstrument(el.id);
            });
        });
    } else {
        createAudioContext();
        document.getElementById('disp').innerText = 'Celular ou Tablet';

        document.addEventListener('touchstart', () => {
            if (audioContext?.state === 'suspended') {
                audioContext.resume();
            }
        });

        document.querySelectorAll('.drum').forEach((el) => {
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                playInstrument(el.id);
            }, { passive: false });
        });
    }
}

console.log(navigator.userAgent);
initEqControls();
setupInputHandlers();
