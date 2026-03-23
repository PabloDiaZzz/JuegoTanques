import Phaser from 'phaser';
import { Game as GameScene } from '../scenes/Game';
import Tank from './Tank';

export type AmmoType = 'NORMAL' | 'FRAG';

export default class Projectile {
    public scene: GameScene;
    public visual: ProjectileVisual;
    public turnSwitched: boolean;
    public owner: Tank;
    public ammoType: AmmoType;
    public isChild: boolean;

    private lastX: number = 0;
    private lastY: number = 0;
    private framesAlive: number = 0;
    private trail: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: GameScene, x: number, y: number, angle: number, power: number, owner: Tank, ammoType: AmmoType = 'NORMAL', isChild: boolean = false) {
        this.scene = scene;
        this.owner = owner;
        this.ammoType = ammoType;
        this.isChild = isChild;

        const radius = isChild ? 3 : 5;
        this.visual = scene.add.circle(x, y, radius, isChild ? 0xff5555 : 0x222222) as ProjectileVisual;
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

        this.trail = scene.add.particles(0, 0, 'pixel', {
            follow: this.visual,
            scale: { start: 3, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 300,
            tint: 0x777777,
            frequency: 10,
            speed: { min: 20, max: 50 },
            angle: { min: 0, max: 360 }
        });

        this.trail.setDepth(20);

        this.scene.uiCamera.ignore(this.trail);

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
                    if (rootBody.label === 'bullet') {
                        return false;
                    }
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

        if (this.visual.y > this.scene.scale.height * 2 + 200) {
            this.destroy();
            this.safeSwitchTurn();
        }
    }

    public onHit(body: MatterJS.BodyType) {
        if (!this.visual.active) return;

        const mainBody = body.parent || body;
        const hitX = this.visual.x;
        const hitY = this.visual.y;
        const impactPos = new Phaser.Math.Vector2(hitX, hitY);
        const angle = this.scene.terrainManager.getAngleAtX(hitX);
        this.scene.lastGlobalImpact = impactPos;
        this.scene.lastImpacts.set(this.owner.body.label, impactPos);

        if (mainBody.label === 'ground') {
            this.scene.terrainManager.createCrater(hitX, hitY, this.isChild ? 35 : 70);
            this.scene.terrainManager.emitExplosionParticles(hitX, hitY, angle);
        } else if (mainBody && (mainBody as TankBody).unit instanceof Tank) {
            const tank = (mainBody as TankBody).unit as Tank;
            tank.takeDamage(this.isChild ? 10 : 25);
        }
        if (this.ammoType === 'FRAG' && !this.isChild && mainBody.label === 'ground') {
            const terrainAngle = this.scene.terrainManager.getAngleAtX(hitX);
            const normal = terrainAngle - Math.PI / 2;
            const spawnDist = 30;
            const spawnX = hitX + Math.cos(normal) * spawnDist;
            const spawnY = hitY + Math.sin(normal) * spawnDist;

            const numFragments = 8;
            const spreadDegrees = 90;

            const startAngle = normal - Phaser.Math.DegToRad(spreadDegrees / 2);
            const angleStep = Phaser.Math.DegToRad(spreadDegrees / (numFragments - 1));
            for (let i = 0; i < numFragments; i++) {
                const randomAngle = Phaser.Math.DegToRad(Phaser.Math.Between(-5, 5));
                const finalAngle = startAngle + (angleStep * i) + randomAngle;
                const randomPower = Phaser.Math.Between(25, 45);
                this.scene.spawnProjectile(spawnX, spawnY, finalAngle, randomPower, this.owner, 'FRAG', true);
            }
        }
        this.scene.cameras.main.shake(100, 0.01);
        this.destroy();
        this.safeSwitchTurn();
    }

    safeSwitchTurn() {
        if (!this.turnSwitched) {
            this.turnSwitched = true;
            const activeProjectiles = this.scene.projectiles.filter(p => p !== this && p.visual && p.visual.active);
            if (activeProjectiles.length === 0) {
                this.scene.switchTurn();
            }
        }
    }

    destroy() {
        if (this.trail) {
            this.trail.stop();
            this.scene.time.delayedCall(300, () => {
                if (this.trail) this.trail.destroy();
            });
        }

        if (this.visual && this.visual.active) {
            this.visual.destroy();
        }
        this.scene.projectiles = this.scene.projectiles.filter(p => p !== this);
    }
}