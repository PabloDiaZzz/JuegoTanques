import { Scene } from 'phaser';
import Button from '../ui/Button';
import { Game as GameScene } from './Game';

export class PauseMenu extends Scene {
    constructor() {
        super('PauseMenu');
    }

    create() {
        const { width, height } = this.scale;
        const gameScene = this.scene.get('Game') as GameScene;

        this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0);
        this.add.text(width / 2, height * 0.2, 'PAUSA', { fontSize: '48px', color: '#fff' }).setOrigin(0.5);

        const btnColor = 0x1e272e;
        const btnWidth = 250;
        const btnHeight = 50;

        new Button(this, btnColor, width / 2, height * 0.4, btnWidth, btnHeight, 'Continuar', () => {
            this.scene.stop();
            this.scene.resume('Game');
        });

        new Button(this, btnColor, width / 2, height * 0.5, btnWidth, btnHeight, 'Reiniciar Partida', () => {
            this.scene.stop('Game');
            this.scene.start('Game', { initialTerrain: gameScene.cleanTerrainPoints, players: gameScene.playerConfigs });
        });

        new Button(this, btnColor, width / 2, height * 0.6, btnWidth, btnHeight, 'Generar Partida', () => {
            this.scene.stop('Game');
            this.scene.start('Game', {players: gameScene.playerConfigs});
        });

        new Button(this, btnColor, width / 2, height * 0.7, btnWidth, btnHeight, 'Tanques', () => {
            this.scene.stop('Game');
            this.scene.start('CharacterSelect');
        });

        new Button(this, btnColor, width / 2, height * 0.8, btnWidth, btnHeight, 'Salir al Menú', () => {
            this.scene.stop('Game');
            this.scene.start('MainMenu');
        });

        this.input.keyboard!.on('keydown-ESC', () => {
            this.scene.stop();
            this.scene.resume('Game');
        })
    }
}