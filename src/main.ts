import StartGame from './game/main';

document.addEventListener('DOMContentLoaded', () => {

    window.game = StartGame('game-container');

    const canvas = document.querySelector('canvas');
    if (canvas) canvas.style.imageRendering = 'auto';
});