import Phaser from 'phaser';
import { Game as GameScene } from '../scenes/Game';

export default class Timer {
    public bg!: Phaser.GameObjects.Rectangle;
    public timeText!: Phaser.GameObjects.BitmapText;
    
    private scene: GameScene;
    private time: number;
    private originalTime: number;
    private timeout: () => void;
    private mode: string;
    private isPaused: boolean = false;

    constructor(scene: GameScene, x: number, y: number, width: number, height: number, time: number, func: () => void, mode: string = 'format') {
        this.scene = scene;
        this.time = time;
        this.originalTime = time;
        this.timeout = func;
        this.mode = mode;

        this.bg = scene.add.rectangle(x, y, width, height, 0x000000, 0.6);
        this.bg.setScrollFactor(0);
        this.bg.setStrokeStyle(2, 0xffffff, 0.8);
        this.bg.setDepth(100);
        this.timeText = this.scene.add.bitmapText(x, y, 'miFuente', this.formatTime(time), 24);
        this.timeText.setOrigin(0.5);
        this.timeText.setScrollFactor(0);
        this.timeText.setDepth(101);
    }

    update(delta: number): void {
        if (this.isPaused) return;
        if (this.time > 0) {
            this.time -= delta / 1000;
            if (this.time < 0) this.time = 0;

            this.timeText.setText(this.formatTime(this.time));
            if (this.time <= 5) {
                this.timeText.setTint(0xff0000);
            } else {
                this.timeText.setTint(0xffffff);
            }

            if (this.time === 0) {
                this.onTimeOut();
            }
        }
    }

    private formatTime(seconds: number): string {
        const totalSeconds = Math.ceil(seconds);
        if (totalSeconds < 60 || this.mode == 'unformat') return totalSeconds.toString();
        const minutes = Math.floor(totalSeconds / 60);
        const partSeconds = totalSeconds % 60;
        return `${minutes}:${partSeconds.toString().padStart(2, '0')}`;
    }


    private onTimeOut(): void {
        this.timeout();
    }

    public pause(): void {
        this.isPaused = true;
    }

    public resume(): void {
        this.isPaused = false;
    }

    public reset(newTime: number = this.originalTime): void {
        this.time = newTime;
    }

    public getTime(): number {
        return this.time;
    }
}