import { AudioManager } from './AudioManager.mjs';
import { Sequencer } from './Sequencer.mjs';
import { UIManager } from './UIManager.mjs';
import { getTarget, getAll , getById, hideAll} from './lib.js';

const keyToInstrument = {
    a: 'caixa', 
    l: 'caixa',
    c: 'bumbo',
    k: 'chimbau',
    s: 'chimbau',
    i: 'chimbauOp',
    u: 'tom',
    p: 'ataque',
    q: 'crash',
    ';': 'conducao',
    '[': 'sino',
    m: 'surdo',
    z: 'bloco'
};

const midiToInstrument = {
    36: 'bumbo',      // C1
    35: 'bumbo',      // B0
    38: 'caixa',      // D1
    40: 'caixa',      // E1
    42: 'chimbau',    // F#1 (Closed HH)
    46: 'chimbauOp',  // A#1 (Open HH)
    41: 'surdo',      // F1 (Low Tom)
    45: 'tom',        // A1 (Mid Tom)
    49: 'crash',      // C#2
    51: 'conducao',   // D#2 (Ride)
    53: 'sino',       // F2 (Ride Bell)
    57: 'ataque',     // A2 (Crash 2)
    37: 'bloco'       // C#1 (Side Stick)
};

// Instâncias das Classes
const audio = new AudioManager();
const sequencer = new Sequencer();
const ui = new UIManager(sequencer);

const btnsAside = getAll('.btnAside');
const btnsMain = getAll('.btnMain');
const sideMenu = getAll('.sideMenu');
const mainMenu = getAll('.mainMenu');
const btnsModelo = getAll('.btnModelo');

const btnSeq = getById('seq');
const btnStop = getById('stop');

btnsMain.forEach(btn => {
    btn.addEventListener('pointerdown', () => {
        //self
        btnsMain.forEach(btn => btn.classList.remove('active'));
        btn.classList.add('active');
        hideAll('.mainMenu');
        getTarget(btn).classList.remove('off');
    });
});

btnsAside.forEach(btn => {
    btn.addEventListener('pointerdown', () => {
        hideAll('.sideMenu');
    });
});

btnsModelo.forEach(btn => {
    btn.addEventListener('pointerdown', () => {
        btnsModelo.forEach(btn => btn.classList.remove('active'));
        btn.classList.add('active');
        changeKit(btn.id);
    });
});

let currentPath = 'normal';
const instruments = [...new Set(Object.values(keyToInstrument))];

const updateAudioParams = () => {
    audio.updateEQ(
        Number(getById('lowGain').value),
        Number(getById('midGain').value),
        Number(getById('highGain').value)
    );
    audio.updateReverb(Number(getById('reverbWet').value));
};

async function changeKit(newPath) {
    currentPath = newPath;
    ui.updateKitVisuals(currentPath, instruments);
    await audio.loadKit(currentPath, instruments);
    updateAudioParams(); // Sincroniza o áudio com os sliders após carregar o kit
    ui.renderGrid('sequencer-grid-container', currentPath);
}

function playInstrument(name, time = 0) {
    const ctx = audio.init();
    const now = ctx.currentTime;
    const delay = time > 0 ? (time - now) * 1000 : 0;
    
    setTimeout(() => ui.animatePad(name), Math.max(0, delay));
    audio.play(name, time);
}

function onTick(step, time) {
    ui.highlightStep(step);
    Object.keys(sequencer.grid).forEach(inst => {
        if (sequencer.grid[inst][step]) {
            playInstrument(inst, time);
        }
    });
}

function setupInputs() {
    // Teclado
    document.addEventListener('keydown', (e) => {
        const inst = keyToInstrument[e.key.toLowerCase()];
        if (inst) playInstrument(inst);
    });

    // Pads Visuais
   getAll('.clip').forEach(pad => {
        let id= pad.parentElement.id;
        pad.addEventListener('pointerdown', () => playInstrument(id));
    });

    // Controles do Sequenciador
    btnSeq.onpointerdown = () => {
        sequencer.start(audio.init(), onTick);
        btnSeq.classList.add('active');
    }
         
    btnStop.onpointerdown = () => {
        sequencer.stop();
        btnSeq.classList.remove('active');
    }
    getById('clear-grid').onpointerdown = () => {
        
        sequencer.clear();
        ui.renderGrid('sequencer-grid-container', currentPath);
    };

    // BPM
    const bpmSlider = getById('bpm');
        bpmSlider.oninput = () => {
            sequencer.tempo = Number(bpmSlider.value);
            getById('bpmValue').innerText = sequencer.tempo;
        };

    // Controle de Passos (8 ou 16)
    const stepSelect = getById('step-count');
    if (stepSelect) {
        stepSelect.onchange = () => {
            sequencer.setSteps(Number(stepSelect.value));
            ui.renderGrid('sequencer-grid-container', currentPath);
        };
    }

    // Kits
    ['heavy', 'normal', 'light', 'perc'].forEach(id => {
        
        getById(id).onpointerdown = () => changeKit(id);
    });

   getAll('.eq-band input').forEach(input => {
        input.addEventListener('input', (e) => {
            updateAudioParams();
            const valSpan = e.target.previousElementSibling.querySelector('span');
            if (valSpan) valSpan.innerText = e.target.value;
        });
    });

    // MIDI
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then(access => {
            for (let input of access.inputs.values()) {
                input.onmidimessage = (msg) => {
                    const [status, note, vel] = msg.data;
                    if ((status & 0xF0) === 0x90 && vel > 0) {
                        const inst = midiToInstrument[note];
                        if (inst) playInstrument(inst);
                    }
                };
            }
        });
    }
}

async function init() {
    sequencer.setupGrid(instruments);
    
    // Pattern Inicial
    sequencer.grid.bumbo[0] = sequencer.grid.bumbo[4] = sequencer.grid.bumbo[8] = sequencer.grid.bumbo[12] = true;
    sequencer.grid.caixa[4] = sequencer.grid.caixa[12] = true;
    
    setupInputs();
    await changeKit('normal');
}

init();
