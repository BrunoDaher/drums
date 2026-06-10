

export function getTarget (btn){
    return document.getElementById(btn.getAttribute('data-target'));
}

export function getAll (seletor){
    return document.querySelectorAll(seletor);
}

export function getById(seletor){
    return document.getElementById(seletor);
}

export function esconde (seletor){
    document.querySelector(seletor).classList.add('active');
}

export function mostra (seletor){
    document.querySelector(seletor).classList.remove('off');
}

export function hideAll(seletor){
    document.querySelectorAll(seletor).forEach(el => el.classList.add('off'));
}