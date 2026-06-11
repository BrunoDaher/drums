export class UIManager {
    constructor(sequencer) {
        this.sequencer = sequencer;
    }

    renderGrid(containerId, path) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        Object.keys(this.sequencer.grid).sort().forEach(inst => {
            const row = document.createElement('div');
            row.className = 'sequencer-row';
            
            let ext = path =="normal" ? 'png' : 'png';
            let src = (`./imgs/${path}/${inst}.${ext}`);

            row.innerHTML = `
                
                <span class="inst-label w100">
                <a>${inst}</a>
                
                <div class="steps-container w100 flex row justBetween" id="steps-${inst}"></div>
            `;

            const stepsContainer = row.querySelector('.steps-container');
            this.sequencer.grid[inst].forEach((active, index) => {
                const step = document.createElement('div');
                step.className = `step ${active ? 'active' : ''} step-${index}`;
                step.onclick = () => {
                    this.sequencer.grid[inst][index] = !this.sequencer.grid[inst][index];
                    step.classList.toggle('active');
                };
                stepsContainer.appendChild(step);
            });
            container.appendChild(row);
        });
    }

    highlightStep(stepIndex) {
        document.querySelectorAll('.step.current').forEach(el => el.classList.remove('current'));
        document.querySelectorAll(`.step-${stepIndex}`).forEach(el => el.classList.add('current'));
    }

    animatePad(instId) {
        const el = document.getElementById(instId);
        if (el) {
            el.classList.add('active');
            setTimeout(() => el.classList.remove('active'), 100);
        }
    }

    updateKitVisuals(path, instruments) {
        
        instruments.forEach(inst => {
            let ext = path =="normal" ? 'png' : 'png';
            const el = document.getElementById(inst);
            if (el) el.style.backgroundImage = `url(./imgs/${path}/${inst}.${ext})`;
        });
    }
}