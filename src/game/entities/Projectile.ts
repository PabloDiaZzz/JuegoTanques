import Phaser from 'phaser';
import { Game as GameScene } from '../scenes/Game';
import Tank from './Tank';

export type AmmoType = 'NORMAL' | 'FRAG' | 'BOUNCE';

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
    private bounces: number = 0;
    private lastBounceFrame: number = 0;
    private maxBounces: number = 2;

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
            isBullet: true,
            restitution: 0
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
            delay: 30000,
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
                const validCollisions = collisions.filter((c: any) => {
                    const bodyHit = c.bodyB || c.bodyA;
                    const rootBody = bodyHit.parent && bodyHit.parent !== bodyHit ? bodyHit.parent : bodyHit;
                    if (rootBody.label === 'bullet') return false;
                    const targetGO = rootBody.gameObject;
                    if (this.framesAlive < 5 && targetGO && (targetGO as any).unit === this.owner) {
                        return false;
                    }
                    return true;
                });

                if (validCollisions.length > 0) {
                    validCollisions.sort((a: any, b: any) => {
                        const pointA = (a.supports && a.supports.length > 0) ? a.supports[0] : { x: currentX, y: currentY };
                        const pointB = (b.supports && b.supports.length > 0) ? b.supports[0] : { x: currentX, y: currentY };
                        const distA = Phaser.Math.Distance.Between(this.lastX, this.lastY, pointA.x, pointA.y);
                        const distB = Phaser.Math.Distance.Between(this.lastX, this.lastY, pointB.x, pointB.y);
                        return distA - distB;
                    });
                    this.onHit(validCollisions[0]);
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

    public onHit(hit: any) {
        if (!this.visual.active || !this.visual.body) return;

        const bodyHit = hit.bodyB || hit.bodyA;
        const mainBody = bodyHit.parent || bodyHit;
        const isTank = mainBody && (mainBody as TankBody).unit instanceof Tank;

        let hitX = this.visual.x;
        let hitY = this.visual.y;

        if (hit.supports && hit.supports.length > 0) {
            hitX = hit.supports[0].x;
            hitY = hit.supports[0].y;
        }

        const impactPos = new Phaser.Math.Vector2(hitX, hitY);

        if (this.ammoType === 'BOUNCE' && !isTank) {
            if (this.bounces < this.maxBounces) {
                const terrainAngle = this.scene.terrainManager.getAngleAtX(hitX);
                const normalAngle = terrainAngle - Math.PI / 2;
                const contactNormal = new Phaser.Math.Vector2(Math.cos(normalAngle), Math.sin(normalAngle));
                const matterBody = this.visual.body as MatterJS.BodyType;
                const incidentVel = new Phaser.Math.Vector2(matterBody.velocity.x, matterBody.velocity.y);
                const dotProduct = incidentVel.dot(contactNormal);
                if (dotProduct >= 0) return;
                const reflection = incidentVel.clone().subtract(contactNormal.clone().scale(2 * dotProduct));
                reflection.scale(0.8);
                this.scene.matter.body.setVelocity(matterBody, { x: reflection.x, y: reflection.y });
                this.scene.matter.body.setPosition(matterBody, {
                    x: hitX + contactNormal.x * 5,
                    y: hitY + contactNormal.y * 5
                });
                this.lastX = matterBody.position.x;
                this.lastY = matterBody.position.y;
                if (this.framesAlive - this.lastBounceFrame > 5) {
                    this.bounces++;
                    this.lastBounceFrame = this.framesAlive;
                }
                return;
            }
        }
        const angle = this.scene.terrainManager.getAngleAtX(hitX);
        this.scene.lastGlobalImpact = impactPos;
        this.scene.lastImpacts.set(this.owner.body.label, impactPos);

        if (mainBody.label === 'ground') {
            this.scene.terrainManager.createCrater(hitX, hitY, this.isChild ? 35 : 70);
            this.scene.terrainManager.emitExplosionParticles(hitX, hitY, angle);
        } else if (isTank) {
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