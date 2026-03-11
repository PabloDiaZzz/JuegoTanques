import { Scene } from 'phaser';

export class MainMenu extends Scene {

    constructor() {
        super('MainMenu');
    }

    create() {
        this.add.image(screen.availWidth / 2, screen.availHeight / 2, 'background');

        this.add.image(screen.availWidth / 2, screen.availHeight / 2, 'logo');

        this.add.text(screen.availWidth / 2, 460, 'Main Menu', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {

            this.scene.start('CharacterSelect');

        });

        this.input.keyboard!.on('keydown-SPACE', () => {
            this.scene.start('CharacterSelect');
        });
    }
}
