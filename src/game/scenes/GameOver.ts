import { Scene } from 'phaser';

export class GameOver extends Scene {

    constructor() {
        super('GameOver');
    }

    create(data: { type: string, winner: string, color: number }) {
        this.cameras.main.setBackgroundColor(data.color);

        this.add.image(screen.width / 2, screen.height / 2, 'background').setAlpha(0.5);

        this.add.text(screen.width / 2, screen.height / 2, 'Game Over', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        switch (data.type) {
            case 'win':
                this.add.text(screen.width / 2, screen.height / 2 + 100, 'Ganador: ' + data.winner, {
                    fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
                    stroke: '#000000', strokeThickness: 8,
                    align: 'center'
                }).setOrigin(0.5);
                break;
            case 'timeout':
                this.add.text(screen.width / 2, screen.height / 2 + 100, 'Tiempo Agotado', {
                    fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
                    stroke: '#000000', strokeThickness: 8,
                    align: 'center'
                }).setOrigin(0.5);
                break;
        }

        this.input.once('pointerdown', () => {

            this.scene.start('MainMenu');
        });

        this.input.keyboard!.on('keydown-SPACE', () => {
            this.scene.start('MainMenu');
        });
    }
}
