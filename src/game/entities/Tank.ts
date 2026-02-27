import * as Phaser from 'phaser';
import Projectile from './Projectile';
import { Game as GameScene } from '../scenes/Game';

export default class Tank {
    public moveMode: boolean = true;
    public canShoot: boolean = true;
    public heal: number = 100;
    public power: number = 100;
    public scene: GameScene;
    public body!: TankBody;
    public container!: Phaser.GameObjects.Container;

    private rotating: boolean = false;
    private barrel!: Phaser.GameObjects.Rectangle;
    private rect!: Phaser.GameObjects.Rectangle;
    private healthBar!: Phaser.GameObjects.Rectangle;
    private hpText!: Phaser.GameObjects.Text;
    private originalInertia!: number;
    private currentBarrelRotation: number;
    private friction!: number;
    private targetAngle: number = 0;
    private trajectoryGraphics!: Phaser.GameObjects.Graphics;
    private showTrajectory: boolean = false;

    constructor(scene: GameScene, x: number, color: number, label: string) {
        this.scene = scene;
        this.bodyColor = color;

        const y: number = this.getTerrainHeight(x) - 30;

        this.setupVisuals(x, y, color);
        this.setupPhysics(x, y, label);

        this.currentBarrelRotation = (x > this.scene.scale.width / 2) ? -Math.PI : 0;
        this.barrel.rotation = this.currentBarrelRotation;
    }

    private setupVisuals(x: number, y: number, color: number): void {
        this.trajectoryGraphics = this.scene.add.graphics();
        this.container = this.scene.add.container(x, y);
        this.rect = this.scene.add.rectangle(0, 0, 50, 40, color, 0.8);
        this.rect.setOrigin(0.5, 0.95);
        this.barrel = this.scene.add.rectangle(0, - (this.rect.height * this.rect.originY), 50, 10, color);
        this.barrel.setOrigin(0, 0.5);
        this.container.add([this.rect, this.barrel]);

        this.healthBar = this.scene.add.rectangle(0, - (this.rect.height * this.rect.originY) - 20, 50, 5, 0x00ff00);
        this.healthBar.setOrigin(0.5, 0.95);
        this.container.add(this.healthBar);
        this.hpText = this.scene.add.text(0, - (this.rect.height * this.rect.originY) - 30, this.heal.toString(), { color: '#ffffff' });
        this.hpText.setOrigin(0.5, 0.95);
        this.container.add(this.hpText);
        this.hpText.setText(this.heal.toString());
    }

    private setupPhysics(x: number, y: number, label: string): void {
        this.friction = 1;
        this.body = this.scene.matter.add.rectangle(x, y, 50, 40, {
            friction: this.friction,
            label: label,
        }) as TankBody;
        this.body.unit = this;
        this.originalInertia = this.body.inertia;
        this.scene.matter.body.setCentre(this.body, { x: 0, y: (this.rect.height / 2 * (2 * this.rect.originY - 1)) }, true);
    }

    update(): void {
        this.container.x = this.body.position.x;
        this.container.y = this.body.position.y;
        this.container.rotation = this.body.angle;

        this.handleRotation();

        if (!this.moveMode && this.showTrajectory) {
            this.drawTrajectory();
        } else {
            this.trajectoryGraphics.clear();
        }
    }

    drawTrajectory(): void {
        this.trajectoryGraphics.clear();
        if (this.moveMode || !this.canShoot) return;
        const barrelLen = this.barrel.width;
        const localMuzzleX = Math.cos(this.currentBarrelRotation) * barrelLen;
        const localMuzzleY = this.barrel.y + Math.sin(this.currentBarrelRotation) * barrelLen;
        const tankRotation = this.container.rotation;
        let px = this.container.x + (localMuzzleX * Math.cos(tankRotation) - localMuzzleY * Math.sin(tankRotation));
        let py = this.container.y + (localMuzzleX * Math.sin(tankRotation) + localMuzzleY * Math.cos(tankRotation));
        const globalAngle = tankRotation + this.currentBarrelRotation;
        let vx = Math.cos(globalAngle) * (this.power / 5);
        let vy = Math.sin(globalAngle) * (this.power / 5);
        this.trajectoryGraphics.lineStyle(3, 0xffffff, 0.5);
        this.trajectoryGraphics.beginPath();
        this.trajectoryGraphics.moveTo(px, py);
        const gravity = 0.28;
        const steps = 300;

        for (let i = 0; i < steps; i++) {
            vy += gravity;
            px += vx;
            py += vy;
            this.trajectoryGraphics.lineTo(px, py);
            if (i > 5) {
                const groundY = this.scene.terrainManager.getHeightAtX(px);
                if (py > groundY) {
                    break;
                }
            }
        }
        this.trajectoryGraphics.strokePath();
    }

    handleRotation() {
        if (!this.moveMode) {
            this.scene.matter.body.setInertia(this.body, Infinity);
            this.scene.matter.body.setAngularVelocity(this.body, 0);
            if (!this.rotating) {
                this.targetAngle = this.getGroundAngle();
                this.rotating = true;
            }
            if (this.rotating) {
                this.stepRotation();
            }
        } else {
            this.rotating = false;
            if (this.body.inertia === Infinity) {
                this.scene.matter.body.setInertia(this.body, this.originalInertia);
            }
        }
    }

    stepRotation() {
        const diff = Phaser.Math.Angle.Wrap(this.targetAngle - this.body.angle);
        if (Math.abs(diff) < 0.02) {
            this.scene.matter.body.setAngle(this.body, this.targetAngle);
            this.rotating = false;
        } else {
            const newAngle = Phaser.Math.Angle.RotateTo(this.body.angle, this.targetAngle, 0.05);
            this.scene.matter.body.setAngle(this.body, newAngle);
        }
    }

    move(direction: string): void {
        const speed = direction === 'left' ? -2 : 2;
        const angle = this.body.angle;

        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        this.scene.matter.setVelocity(this.body, vx, vy);
    }

    takeDamage(amount: number): void {
        this.heal -= amount;
        if (this.heal <= 0) this.heal = 0;
        this.healthBar.width = this.heal / 2;
        this.hpText.setText(this.heal.toString());
        if (this.heal === 0) this.destroy();
    }

    destroy(): void {
        this.container.destroy();
        this.scene.turnManager.removePlayer(this);
    }

    getTerrainHeight(x: number): number {
        return this.scene.terrainManager.getHeightAtX(x);
    }

    getGroundAngle(): number {
        const x = this.body.position.x;
        const mathGroundY = this.scene.terrainManager.getHeightAtX(x);
        const distanceToGround = mathGroundY - this.body.position.y;

        if (distanceToGround > 100) {
            return this.body.angle;
        }

        return this.scene.terrainManager.getAngleAtX(x);
    }

    alignToGround(): void {
        const angle = this.getGroundAngle();
        this.container.rotation = angle;
        this.body.angle = angle;
    }

    toggleMode(): void {
        this.moveMode = !this.moveMode;
        if (this.moveMode) {
            this.scene.matter.body.setInertia(this.body, this.originalInertia);
            this.rect.setFillStyle(this.bodyColor, 0.8)
            this.barrel.setFillStyle(this.bodyColor)
        } else {
            this.rect.setFillStyle(this.bodyColor)
            this.barrel.setFillStyle(this.bodyColor, 0.8)
        }
    }

    control(direction: string): void {
        if (!this.canShoot) return
        if (this.moveMode) {
            this.move(direction);
        } else {
            this.rotateCanon(direction);
        }
    }

    rotateCanon(direction: string): void {
        const angle = direction === 'left' ? -0.03 : 0.03;
        this.currentBarrelRotation = Phaser.Math.Clamp(
            this.currentBarrelRotation + angle,
            -9 * Math.PI / 8,
            Math.PI / 8
        );
        this.barrel.rotation = this.currentBarrelRotation;
    }

    shoot(power: number): void {
        if (!this.canShoot) return;

        const barrelLen: number = this.barrel.width;
        const localMuzzleX: number = Math.cos(this.currentBarrelRotation) * barrelLen;
        const localMuzzleY: number = this.barrel.y + Math.sin(this.currentBarrelRotation) * barrelLen;
        const tankRotation: number = this.container.rotation;

        const worldMuzzleX: number = this.container.x +
            (localMuzzleX * Math.cos(tankRotation) - localMuzzleY * Math.sin(tankRotation));

        const worldMuzzleY: number = this.container.y +
            (localMuzzleX * Math.sin(tankRotation) + localMuzzleY * Math.cos(tankRotation));

        const globalAngle: number = tankRotation + this.currentBarrelRotation;

        this.scene.spawnProjectile(worldMuzzleX, worldMuzzleY, globalAngle, power);

        this.canShoot = false;
    }

    checkTurn(): boolean {
        return this.scene.currentTurn === this;
    }
}