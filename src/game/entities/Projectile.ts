import Phaser from 'phaser';
import { Game as GameScene } from '../scenes/Game';

export default class Projectile {
    public scene: GameScene;
    public visual: ProjectileVisual;
    public turnSwitched: boolean;

    constructor(scene: GameScene, x: number, y: number, angle: number, power: number) {
        this.scene = scene;
        this.visual = scene.add.circle(x, y, 5, 0xffff00) as ProjectileVisual;

        scene.matter.add.gameObject(this.visual, {
            shape: 'circle',
            frictionAir: 0,
            friction: 0.05,
            label: 'bullet'
        }) as ProjectileVisual;

        this.turnSwitched = false;
        this.visual.parentLogic = this;

        const velocityX = Math.cos(angle) * (power / 5);
        const velocityY = Math.sin(angle) * (power / 5);
        this.visual.setVelocity(velocityX, velocityY);

        scene.time.addEvent({
            delay: 3000,
            callback: () => this.safeSwitchTurn()
        });
    }

    safeSwitchTurn() {
        if (!this.turnSwitched) {
            this.turnSwitched = true;
            this.scene.switchTurn();
        }
    }

    destroy() {
        if (this.visual && this.visual.active) {
            this.visual.destroy();
        }
    }
}