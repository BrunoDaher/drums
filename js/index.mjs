const keyToInstrument = {
    a: 'caixa',
    l: 'caixa',
    c: 'bumbo',
    k: 'chimbau',
    s: 'chimbau',
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
const audioBuffers = {}; // Cache para latência zero

function createAudioContext() {
    if (!audioContext) {
        // Forçar 44.1kHz ajuda muito na estabilidade do iOS
        audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 44100 
        });
    }
    return audioContext;
}



// Carrega todos os sons na inicialização
async function preloadSamples() {
    const ctx = createAudioContext();
    const uniqueInstruments = [...new Set(Object.values(keyToInstrument))];
    
    //console.log("Iniciando pré-carregamento dos samples...");
    
    const loadTasks = uniqueInstruments.map(async (name) => {
        try {
            const response = await fetch(`./mp3/${name}.mp3`);
            const arrayBuffer = await response.arrayBuffer();
            const decodedData = await ctx.decodeAudioData(arrayBuffer);
            audioBuffers[name] = decodedData;
        } catch (err) {
            console.error(`Erro ao carregar o sample: ${name}`, err);
        }
    });

    await Promise.all(loadTasks);
    //console.log("Samples carregados e decodificados. Pronto para tocar!");
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

function updateControlValues() {
    if (!eqNodes || !reverbNodes) return;

    const lowGain = Number(document.getElementById('lowGain')?.value || 0);
    const midGain = Number(document.getElementById('midGain')?.value || 0);
    const highGain = Number(document.getElementById('highGain')?.value || 0);
    const wetValue = Number(document.getElementById('reverbWet')?.value || 0);

    eqNodes.low.gain.value = lowGain;
    eqNodes.mid.gain.value = midGain;
    eqNodes.high.gain.value = highGain;

    reverbNodes.wetGain.gain.value = wetValue / 100;
    reverbNodes.dryGain.gain.value = 1 - (wetValue / 100);

    if (document.getElementById('lowValue')) document.getElementById('lowValue').innerText = lowGain;
    if (document.getElementById('midValue')) document.getElementById('midValue').innerText = midGain;
    if (document.getElementById('highValue')) document.getElementById('highValue').innerText = highGain;
    if (document.getElementById('reverbWetValue')) document.getElementById('reverbWetValue').innerText = wetValue;
}

function animateButton(name) {
    const el = document.getElementById(name);
    if (!el) return;
    //console.log(el)
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 100);
}

function play(name) {
    const ctx = createAudioContext();
    
    // Disparo imediato do buffer em cache
    if (audioBuffers[name]) {
        const eq = createEqualizer(ctx);
        createReverb(ctx, eq.high);
        updateControlValues();

        const source = ctx.createBufferSource();
        source.buffer = audioBuffers[name];
        source.connect(eq.low);

        if (ctx.state === 'suspended') ctx.resume();
        source.start(0);
    }
}

function playInstrument(name) {
    animateButton(name);
    play(name);
}

function initEqControls() {
    ['low', 'mid', 'high'].forEach((band) => {
        const input = document.getElementById(`${band}Gain`);
        if (input) input.addEventListener('input', updateControlValues);
    });

    const reverbWet = document.getElementById('reverbWet');
    const reverbDuration = document.getElementById('reverbDuration');
    
    if (reverbWet) reverbWet.addEventListener('input', updateControlValues);
    if (reverbDuration) {
        reverbDuration.addEventListener('input', () => {
            if (reverbNodes) {
                const duration = Number(reverbDuration.value);
                reverbNodes.convolver.buffer = createImpulseResponse(audioContext, duration, 2.0);
                document.getElementById('reverbDurationValue').innerText = duration.toFixed(1);
            }
        });
    }
}

function setupInputHandlers() {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Dentro do else (Mobile) do setupInputHandlers
document.addEventListener('touchstart', function init() {
    const ctx = createAudioContext();
    
    // Toca um silêncio absoluto para abrir o canal de hardware
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    
    if (ctx.state === 'suspended') ctx.resume();
    
    // Agora que o canal abriu, tenta carregar se ainda não carregou
    if (Object.keys(audioBuffers).length === 0) {
        preloadSamples();
    }
    
    document.removeEventListener('touchstart', init);
}, false);

        if (!isMobile) {
            document.addEventListener('keydown', (event) => {
                const instrument = keyToInstrument[event.key.toLowerCase()];
                if (instrument) playInstrument(instrument);
            });

            document.querySelectorAll('.drum').forEach((el) => {
                el.addEventListener('mousedown', () => playInstrument(el.id));
            });
        }   else {
        document.getElementById('disp').className = 'bi-phone';
        document.getElementById('disp').innerText = 'Mobile';

        // Função para destravar o áudio no primeiro toque em QUALQUER lugar
        const unlockAudio = () => {
            const ctx = createAudioContext();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            
            // Toca um buffer vazio rápido só para o iOS entender que o canal está aberto
            const buffer = ctx.createBuffer(1, 1, 22050);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);

            // Remove os listeners de "destrava" após o primeiro sucesso
            window.removeEventListener('touchstart', unlockAudio);
            window.removeEventListener('mousedown', unlockAudio);
        };

        window.addEventListener('touchstart', unlockAudio);
        window.addEventListener('mousedown', unlockAudio);

        document.querySelectorAll('.drum').forEach((el) => {
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                // Garante que o contexto está ativo antes de tocar
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                playInstrument(el.id);
            }, { passive: false });
        });
    }
}



// Inicialização Sequencial
initEqControls();
setupInputHandlers();
preloadSamples(); // Começa a carregar assim que o script roda