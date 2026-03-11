import Phaser from 'phaser';
import { Game as GameScene } from '../scenes/Game';

export default class Slider {
    private scene: GameScene;
    public handle: Phaser.GameObjects.Arc;
    public track: Phaser.GameObjects.Rectangle;
    private height: number = 200;
    private limit: number = 100;

    constructor(scene: GameScene, x: number, y: number, height: number, limit: number, onUpdate: (value: number) => void) {
        this.scene = scene;
        this.height = height;
        this.limit = limit;
        this.track = scene.add.rectangle(x, y, 10, this.height, 0x333333).setOrigin(0.5, 0);
        this.handle = scene.add.circle(x, y, 15, 0xffffff).setInteractive({ draggable: true });
        this.handle.setScrollFactor(0);
        this.track.setScrollFactor(0);
        this.setupEvents(y, onUpdate);
    }

    private setupEvents(startY: number, onUpdate: Function): void {
        this.handle.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {

            const clampedY = Phaser.Math.Clamp(dragY, startY, startY + this.height);
            this.handle.y = clampedY;

            const percentage = 1 - ((clampedY - startY) / this.height);
            onUpdate(Math.round(percentage * this.limit));
        });
    }

    public setValue(value: number) {
        const p = Phaser.Math.Clamp(value / this.limit, 0, 1);
        this.handle.y = this.track.y + (this.height * (1 - p));
    }

    public setVisible(visible: boolean = true): void {
        this.track.setVisible(visible);
        this.handle.setVisible(visible);
        if (visible) {
            this.handle.setInteractive();
        } else {
            this.handle.disableInteractive();
        }
    }
}