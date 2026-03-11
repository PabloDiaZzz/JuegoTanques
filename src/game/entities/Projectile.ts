import Phaser from 'phaser';
import { Game as GameScene } from '../scenes/Game';
import Tank from './Tank';

export default class Projectile {
    public scene: GameScene;
    public visual: ProjectileVisual;
    public turnSwitched: boolean;
    public owner: Tank;

    constructor(scene: GameScene, x: number, y: number, angle: number, power: number, owner: Tank) {
        this.scene = scene;
        this.visual = scene.add.circle(x, y, 5, 0xffff00) as ProjectileVisual;
        this.owner = owner;

        scene.matter.add.gameObject(this.visual, {
            shape: 'circle',
            frictionAir: 0,
            friction: 0.05,
            label: 'bullet',
            isBullet: true
        }) as ProjectileVisual;

        this.turnSwitched = false;
        this.visual.unit = this;

        const velocityX = Math.cos(angle) * (power / 5);
        const velocityY = Math.sin(angle) * (power / 5);
        this.visual.setVelocity(velocityX, velocityY);

        scene.time.addEvent({
            delay: 10000,
            callback: () => this.safeSwitchTurn()
        });
    }

    update() {
        if (!this.visual || !this.visual.active || !this.visual.body) return;
        if (this.visual.y > this.scene.scale.height * 2 + 200) this.safeSwitchTurn();
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