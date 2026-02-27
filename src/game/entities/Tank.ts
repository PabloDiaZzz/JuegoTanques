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
    public bodyColor: number;

    private rotating: boolean = false;
    private barrel!: Phaser.GameObjects.Rectangle;
    private rect!: Phaser.GameObjects.Rectangle;
    private healthBar!: Phaser.GameObjects.Rectangle;
    private hpText!: Phaser.GameObjects.Text;
    private originalInertia!: number;
    private currentBarrelRotation: number;
    private friction: number = 0.5;
    private targetAngle: number = 0;
    private trajectoryGraphics!: Phaser.GameObjects.Graphics;
    private showTrajectory: boolean = true;
    private legitTrajectory: boolean = true;

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

        if (this.body.position.y > this.scene.scale.height * 2 + 200) this.takeDamage(100);

        this.handleRotation();

        if (this.showTrajectory) this.drawTrajectory();
    }

    private drawTrajectory(): void {
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

        const gravity: number = 0.28;
        const steps: number = 300;
        if (this.legitTrajectory) {
            this.trajectoryGraphics.fillStyle(this.bodyColor, 0.8)
            let maxPuntos: number = 5;
            let lastDrawnX = px;
            let lastDrawnY = py;
            const separacionDeseada = 35;
            for (let i = 0; i < steps; i++) {
                vy += gravity;
                px += vx;
                py += vy;
                const dx = px - lastDrawnX;
                const dy = py - lastDrawnY;
                const distancia = Math.sqrt(dx * dx + dy * dy);
                if (distancia >= separacionDeseada) {
                    this.trajectoryGraphics.fillCircle(px, py, 1.5 * maxPuntos--);
                    lastDrawnX = px;
                    lastDrawnY = py;

                    if (maxPuntos <= 0) {
                        break;
                    }
                }

                if (i > 5) {
                    const groundY = this.scene.terrainManager.getHeightAtX(px);
                    if (py > groundY) {
                        break;
                    }
                }
            }
        } else {
            this.trajectoryGraphics.lineStyle(3, 0xffffff, 0.5);
            this.trajectoryGraphics.beginPath();
            this.trajectoryGraphics.moveTo(px, py);
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
    }

    private handleRotation(): void {
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

    private stepRotation(): void {
        const diff = Phaser.Math.Angle.Wrap(this.targetAngle - this.body.angle);
        if (Math.abs(diff) < 0.02) {
            this.scene.matter.body.setAngle(this.body, this.targetAngle);
            this.rotating = false;
        } else {
            const newAngle = Phaser.Math.Angle.RotateTo(this.body.angle, this.targetAngle, 0.05);
            this.scene.matter.body.setAngle(this.body, newAngle);
        }
    }

    private move(direction: string): void {
        const speed: number = direction === 'left' ? -2 : 2;
        const angle: number = this.getGroundAngle();
        const posY: number = this.body.bounds.max.y;
        const groundY: number = this.getTerrainHeight(this.body.position.x) - 2;
        const distanceToGround = Math.abs(posY - groundY);
        const dFactor: number = distanceToGround <= 10 ? 1 : Phaser.Math.Clamp((10 - distanceToGround) / 10, 0, 1);
        if (dFactor > 0 && Math.abs(this.body.angle - this.getGroundAngle()) < 1) {
            const targetVx = Math.cos(angle) * speed * dFactor;
            const targetVy = Math.sin(angle) * speed * dFactor;
            const forceMult = 0.005 * this.body.mass;
            const forceX = (targetVx - this.body.velocity.x) * forceMult;
            const forceY = (targetVy - this.body.velocity.y) * forceMult;

            this.scene.matter.applyForce(this.body, { x: forceX, y: forceY });
        }
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