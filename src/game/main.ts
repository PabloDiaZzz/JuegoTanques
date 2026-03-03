import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { AUTO, Game } from 'phaser';
import Phaser from 'phaser';

const config = {
    type: AUTO,
    width: screen.availWidth,
    height: screen.availHeight,
    parent: 'game-container',
    backgroundColor: '#028af8',
    render: {
        antialias: true,
        antialiasGL: true,
        roundPixels: true
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { x: 0, y: 1 },
            debug: false,
            getDelta: (time: number, delta: number) => {
                return 1000 / 60;
            }
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver
    ]
};

const StartGame = (parent: string | HTMLElement) => {

    return new Game({ ...config, parent });

}

export default StartGame;
