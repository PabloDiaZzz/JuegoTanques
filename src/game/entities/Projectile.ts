import Phaser from 'phaser';
import { Game as GameScene } from '../scenes/Game';
import Tank from './Tank';

export default class Projectile {
    public scene: GameScene;
    public visual: ProjectileVisual;
    public turnSwitched: boolean;
    public owner: Tank;

    private lastX: number = 0;
    private lastY: number = 0;
    private framesAlive: number = 0;

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
        this.visual.setSensor(true);

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
        this.framesAlive++;

        const currentX = this.visual.x;
        const currentY = this.visual.y;

        if (this.lastX !== undefined && this.lastY !== undefined) {
            const bodies = this.scene.matter.world.getAllBodies().filter(body => body !== this.visual.body);

            const collisions = this.scene.matter.query.ray(
                bodies,
                { x: this.lastX, y: this.lastY },
                { x: currentX, y: currentY }
            );

            if (collisions.length > 0) {
                const hit = collisions.find((c: any) => {
                    const bodyHit = c.bodyB || c.bodyA;
                    const rootBody = bodyHit.parent && bodyHit.parent !== bodyHit ? bodyHit.parent : bodyHit;
                    const targetGO = rootBody.gameObject;
                    if (this.framesAlive < 5) {
                        if (targetGO && (targetGO as any).unit === this.owner) {
                            return false;
                        }
                    }
                    return true;
                });
                if (hit) {
                    this.onHit(hit.bodyB as MatterJS.BodyType);
                    return;
                }
            }
        }

        this.lastX = currentX;
        this.lastY = currentY;

        if (this.visual.y > this.scene.scale.height * 2 + 200) this.safeSwitchTurn();
    }

    public onHit(body: MatterJS.BodyType) {
        if (!this.visual.active) return;

        const mainBody = body.parent || body;
        const hitX = this.visual.x;
        const hitY = this.visual.y;
        const impactPos = new Phaser.Math.Vector2(hitX, hitY);
        this.scene.lastGlobalImpact = impactPos;
        this.scene.lastImpacts.set(this.owner.body.label, impactPos);

        if (mainBody.label === 'ground') {
            this.scene.terrainManager.createCrater(hitX, hitY, 70);
        } else if (mainBody && (mainBody as TankBody).unit instanceof Tank) {
            const tank = (mainBody as TankBody).unit as Tank;
            tank.takeDamage(25);
        }
        this.scene.cameras.main.shake(100, 0.01);
        this.destroy();
        this.safeSwitchTurn();
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