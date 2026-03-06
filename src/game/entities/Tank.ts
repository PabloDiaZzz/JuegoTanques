import * as Phaser from 'phaser';
import { Game as GameScene } from '../scenes/Game';

export default class Tank {
    public moveMode: boolean = true;
    public canShoot: boolean = true;
    public health: number = 100;
    public power: number = 100;
    public fuel: number = 150;
    public scene: GameScene;
    public body!: TankBody;
    public container!: Phaser.GameObjects.Container;
    public bodyColor: number;
    public readonly maxFuel: number = 150;
    public fuelbar!: Phaser.GameObjects.Rectangle;
    public fuelbarOWidth!: number;

    protected fuelCost: number = 0.4;
    protected rotating: boolean = false;
    protected barrel!: Phaser.GameObjects.Image;
    protected rect!: Phaser.GameObjects.Rectangle;
    protected healthBar!: Phaser.GameObjects.Rectangle;
    protected hpText!: Phaser.GameObjects.BitmapText;
    protected originalInertia!: number;
    protected currentBarrelRotation: number;
    protected friction: number = 0.5;
    protected targetAngle: number = 0;
    protected trajectoryGraphics!: Phaser.GameObjects.Graphics;
    protected showTrajectory: boolean = true;
    protected legitTrajectory: boolean = true;
    protected defaultYCenter: number = 0;
    protected lastX: number = 0;
    protected lastY: number = 0;

    constructor(scene: GameScene, x: number, color: number, label: string) {
        this.scene = scene;
        this.bodyColor = color;

        const y: number = this.getTerrainHeight(x) - 50;

        this.setupVisuals(x, y, color);
        this.setupPhysics(x, y, label);

        this.currentBarrelRotation = (x > this.scene.scale.width / 2) ? -Math.PI : 0;
        this.barrel.rotation = this.currentBarrelRotation;
        this.lastX = this.body.position.x;
        this.lastY = this.body.position.y;
    }

    private setupVisuals(x: number, y: number, color: number): void {
        this.trajectoryGraphics = this.scene.add.graphics();
        this.container = this.scene.add.container(x, y);
        this.rect = this.scene.add.rectangle(0, 0, 80, 50, color, 0.8);
        this.rect.setOrigin(0.5, 0.9);
        const bodySprite = this.scene.add.image(0, 0, 'tank_body').setDisplaySize(80, 50);
        bodySprite.setOrigin(0.5, 0.7);
        bodySprite.setTint(color);
        this.barrel = this.scene.add.image(0, -25, 'tank_barrel').setScale(0.55);
        this.barrel.setTint(color);
        this.barrel.setOrigin(0.1, 0.5);
        this.container.add([this.barrel, bodySprite]);

        this.healthBar = this.scene.add.rectangle(0, - (this.rect.height * this.rect.originY) - 20, 50, 5, 0x00ff00);
        this.healthBar.setOrigin(0.5, 0.95);
        this.container.add(this.healthBar);

        this.fuelbar = this.scene.add.rectangle(0, - (this.rect.height * this.rect.originY) - 12, 50, 5, 0x964B00);
        this.fuelbarOWidth = this.fuelbar.width;
        this.fuelbar.setOrigin(0.5, 0.95);
        this.container.add(this.fuelbar);

        this.hpText = this.scene.add.bitmapText(0, - (this.rect.height * this.rect.originY) - 30, 'miFuente', this.health.toString(), 15);
        this.hpText.setOrigin(0.5, 0.95);
        this.container.add(this.hpText);
        this.hpText.setText(this.health.toString());
    }

    private setupPhysics(x: number, y: number, label: string): void {
        this.body = this.scene.matter.add.rectangle(x, y, 80, 50, {
            friction: this.friction,
            label: label,
            chamfer: { radius: [0, 0, 20, 20] }
        }) as TankBody;
        this.body.unit = this;
        this.scene.matter.body.setInertia(this.body, this.body.inertia * 10);
        this.originalInertia = this.body.inertia;
        this.defaultYCenter = this.rect.height / 2 * (2 * this.rect.originY - 1);
        this.scene.matter.body.setCentre(this.body, { x: 0, y: this.defaultYCenter }, true);
    }

    update(delta: number): void {
        this.container.x = this.body.position.x;
        this.container.y = this.body.position.y;
        this.container.rotation = this.body.angle;

        if (this.body.position.y > this.scene.scale.height * 2 + 200) this.takeDamage(100);

        this.handleRotation(delta);

        if (this.showTrajectory) this.drawTrajectory();

        this.handleFuel();
    }

    private handleFuel() {
        if (this.scene.currentTurn != this) return;
        const distance = Phaser.Math.Distance.Between(
            this.body.position.x,
            this.body.position.y,
            this.lastX,
            this.lastY
        );
        if (this.fuel > 0 && distance > 0.01) {
            this.fuel -= distance * this.fuelCost;
            if (this.fuel < 0) this.fuel = 0;

            this.fuelbar.width = this.fuel / (this.maxFuel / this.fuelbarOWidth);
        }
        this.lastX = this.body.position.x;
        this.lastY = this.body.position.y;
    }

    private drawTrajectory(): void {
        this.trajectoryGraphics.clear();
        if (this.moveMode || !this.canShoot || this.scene.currentTurn !== this) return;
        const barrelLen = this.barrel.displayWidth;
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

    private handleRotation(delta: number): void {
        if (!this.moveMode) {
            this.scene.matter.body.setInertia(this.body, Infinity);
            this.scene.matter.body.setAngularVelocity(this.body, 0);
            if (!this.rotating) {
                this.targetAngle = this.getGroundAngle();
                this.rotating = true;
            }
            if (this.rotating) {
                this.stepRotation(delta);
            }
        } else {
            this.rotating = false;
            if (this.body.inertia === Infinity) {
                this.scene.matter.body.setInertia(this.body, this.originalInertia);
            }
        }
    }

    private stepRotation(delta: number): void {
        const diff = Phaser.Math.Angle.Wrap(this.targetAngle - this.body.angle);
        const rotationSpeed = 0.003 * delta;
        if (Math.abs(diff) < rotationSpeed) {
            this.scene.matter.body.setAngle(this.body, this.targetAngle);
            this.rotating = false;
        } else {
            const newAngle = Phaser.Math.Angle.RotateTo(this.body.angle, this.targetAngle, rotationSpeed);
            this.scene.matter.body.setAngle(this.body, newAngle);
        }
    }

    protected move(direction: string, delta: number): void {
        if (this.fuel <= 0) {
            this.toggleMode();
            return;
        }
        const timeCorrection: number = delta / 16.66;
        const speed: number = direction === 'left' ? -2 : 2;
        const angle: number = this.getGroundAngle(this.body.position.x + 5 * speed);
        const posY: number = this.body.bounds.max.y;
        const groundY: number = this.getTerrainHeight(this.body.position.x) - 2;
        const distanceToGround = Math.abs(posY - groundY);
        const dFactor: number = distanceToGround <= 20 ? 1 : Phaser.Math.Clamp((40 - distanceToGround) / 20, 0, 1);
        if (dFactor > 0 && Math.abs(this.body.angle - this.getGroundAngle()) < 1) {
            this.applyMovementForce(angle, speed, dFactor, timeCorrection, direction);
        }
    }

    protected applyMovementForce(angle: number, speed: number, dFactor: number, timeCorrection: number, direction: string) {
        const targetVx = Math.cos(angle) * speed * dFactor;
        const targetVy = Math.sin(angle) * speed * dFactor;
        const forceMult = 0.005 * this.body.mass * timeCorrection;
        const forceX = (targetVx - this.body.velocity.x) * forceMult;
        const forceY = (targetVy - this.body.velocity.y) * forceMult * 0.5;

        this.scene.matter.applyForce(this.body, { x: forceX, y: forceY });
        const backOffset = direction === 'left' ? 20 : -20;
        const backPosition = {
            x: this.body.position.x + (backOffset * (Phaser.Math.RadToDeg(angle) > 45 ? -1 : 1)),
            y: this.body.position.y
        };
        const stabilityFactor = Math.abs(Math.cos(2 * angle));
        this.scene.matter.body.applyForce(this.body, backPosition, {
            x: 0,
            y: 0.005 * this.body.mass * stabilityFactor
        });
    }

    takeDamage(amount: number): void {
        this.health -= amount;
        if (this.health <= 0) this.health = 0;
        this.healthBar.width = this.health / 2;
        this.hpText.setText(this.health.toString());
        if (this.health === 0) this.destroy();
    }

    destroy(): void {
        this.container.destroy();
        this.scene.matter.world.remove(this.body);
        this.scene.turnManager.removePlayer(this);
    }

    getTerrainHeight(x: number): number {
        return this.scene.terrainManager.getHeightAtX(x);
    }

    getGroundAngle(x: number = this.body.position.x): number {
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
            // this.rect.setFillStyle(this.bodyColor, 0.8)
            // this.barrel.setFillStyle(this.bodyColor)
        } else {
            // this.rect.setFillStyle(this.bodyColor)
            // this.barrel.setFillStyle(this.bodyColor, 0.8)
        }
    }

    control(direction: string, delta: number): void {
        if (!this.canShoot) return
        if (this.moveMode) {
            this.move(direction, delta);
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

        const barrelLen: number = this.barrel.displayWidth;
        const localMuzzleX: number = Math.cos(this.currentBarrelRotation) * barrelLen;
        const localMuzzleY: number = this.barrel.y + Math.sin(this.currentBarrelRotation) * barrelLen;
        const tankRotation: number = this.container.rotation;

        const worldMuzzleX: number = this.container.x +
            (localMuzzleX * Math.cos(tankRotation) - localMuzzleY * Math.sin(tankRotation));

        const worldMuzzleY: number = this.container.y +
            (localMuzzleX * Math.sin(tankRotation) + localMuzzleY * Math.cos(tankRotation));

        const globalAngle: number = tankRotation + this.currentBarrelRotation;

        this.scene.spawnProjectile(worldMuzzleX, worldMuzzleY, globalAngle, power, this);
        this.canShoot = false;
    }

    checkTurn(): boolean {
        return this.scene.currentTurn === this;
    }

    public checkLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
        const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
        const steps = Math.floor(distance / 10);

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const checkX = Phaser.Math.Linear(x1, x2, t);
            const checkY = Phaser.Math.Linear(y1, y2, t);

            const terrainHeight = this.getTerrainHeight(checkX);
            if (checkY > terrainHeight) return false;
        }
        return true;
    }

    public canSeeFrom(fromX: number, fromY: number, target: Tank): boolean {
        return this.checkLineOfSight(fromX, fromY, target.body.position.x, target.body.position.y - 20);
    }

    public canSee(target: Tank): boolean {
        return this.canSeeFrom(this.body.position.x, this.body.position.y - 20, target);
    }
}