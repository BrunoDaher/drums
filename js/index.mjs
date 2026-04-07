
import { Audio } from './webAudio.js';


const audio = new Audio('x');

// Safari-optimized play function using Web Audio API for lower latency
function play(audioUrl) {
    if (!window._safariAudioContext) {
        window._safariAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = window._safariAudioContext;

    fetch(audioUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {  
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start(0);
        })
        .catch(err => {
            // fallback to HTMLAudioElement if Web Audio fails
            const audioElement = new window.Audio(audioUrl);
            audioElement.currentTime = 0;
            audioElement.play();
        });
}

function animateButton(selector) {
    const el = document.getElementById(selector);
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 100);
}

function playInstrument(name) {
    animateButton(name);
    console.log(`Playing instrument: ${name}`);
    play(`./mp3/${name}.mp3`);
}

const keyToInstrument = {
    'a': 'caixa',
    'l': 'caixa',
    'c': 'bumbo',
    'k': 'chimbau',
    'i': 'chimbauA',
    'o': 'crash',
    'p': 'ataque',
    ',': 'conducao',
    '.': 'sino',
    'n': 'surdo',       
    'm': 'tom',
    'z': 'bloco',
};

 console.log(navigator.userAgent);  
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

} 
    else //mobile devices 
    {
        
        document.querySelectorAll('label').forEach((el) => {
           console.log(el);
         }
        );

        document.getElementById('disp').innerText='Celular ou Tablet';
        
        document.addEventListener('touchstart', () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
                }
        });

        document.querySelectorAll('.drum').forEach((el) => {
                el.addEventListener('touchstart', (e) => {
                    console.log('touchstart', el.id);
                    e.preventDefault();
                    playInstrument(el.id);
                }, { passive: false });
            });
   
    }

const key = event?.key?.toLowerCase?.();
const instrument = key ? keyToInstrument[key] : undefined;

if (instrument) {
    playInstrument(instrument);
}
