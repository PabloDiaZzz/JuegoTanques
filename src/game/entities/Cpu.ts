import Tank from "./Tank";
import { Game as GameScene } from '../scenes/Game';

export default class CPU extends Tank {
    public level: number = 1;

    private target: Tank | null = null;
    private state: 'moving' | 'aiming' | 'shooting' | 'waiting' = 'waiting';
    private actionTimer: number = 0;
    private destinationX: number | null = null;
    private canonAngle: number = - Math.PI / 4;
    private searchedAngle: boolean = false;

    constructor(scene: GameScene, x: number, color: number, label: string) {
        super(scene, x, color, label);
    }

    override update(delta: number): void {
        super.update(delta);

        if (!this.checkTurn()) {
            this.state = 'waiting';
            this.destinationX = null;
            return;
        }

        if (this.scene.time.now < this.actionTimer) return;

        switch (this.state) {
            case 'waiting':
                this.initTurn();
                break;
            case 'moving':
                this.handleMovement(delta);
                break;
            case 'aiming':
                this.handleAim(delta);
                break;
            case 'shooting':
                this.handleShot()
                break;
        }
    }

    private initTurn(): void {
        this.target = this.setTarget();
        this.destinationX = this.findBestPosition();
        this.actionTimer = this.scene.time.now + 1000;
        this.state = 'moving';
        this.scene.turnTimer.pause();
    }

    private handleMovement(delta: number): void {
        if (!this.moveMode) this.toggleMode();
        if (this.destinationX === null) return;
        if (this.scene.time.now > this.actionTimer + 5000) {
            this.destinationX = null;
            this.state = 'aiming';
            this.actionTimer = this.scene.time.now + 2000;
            return;
        }
        const currentX = this.body.position.x;
        const distance = this.destinationX - currentX;

        if (Math.abs(distance) < 5 || this.fuel <= 0) {
            this.destinationX = null;
            this.state = 'aiming';
            this.actionTimer = this.scene.time.now + 1000;
            return;
        }

        const direction = distance > 0 ? 'right' : 'left';
        this.control(direction, delta);
    }

    private handleAim(delta: number): void {
        this.body.isStatic = true;
        this.body.velocity.x = 0;
        this.body.velocity.y = 0;
        this.body.angle = this.body.angle;
        if (!this.isStable()) return;

        if (this.moveMode) {
            this.toggleMode()
            return
        };

        const upLimit = -Math.PI / 2;
        const isEnemyRight = this.target!.body.position.x > this.body.position.x;
        const sideLimit = isEnemyRight ? Math.PI / 8 : -9 * Math.PI / 8;

        if (!this.alignCanon(this.canonAngle)) return;

        this.power = this.findBestPower(this.canonAngle);

        switch (this.level) {
            case 1:
                if (this.power === 0) this.power = 75;
                break;
            case 2:
                if (this.power === 0 && !this.searchedAngle) {
                    this.canonAngle = Phaser.Math.FloatBetween(upLimit, sideLimit);
                    this.searchedAngle = true;
                    return;
                }
                if (this.power === 0 && this.searchedAngle) this.power = 75;
                break;
            case 3:
                if (this.power === 0) {
                    this.canonAngle = Phaser.Math.FloatBetween(upLimit, sideLimit);
                    return;
                }
                break;
        }
        if (this.power !== 0) {
            this.state = 'shooting';
            this.actionTimer = this.scene.time.now + 1000;
        }
    }

    private handleShot(): void {
        let finalPower = this.power;

        if (this.level === 1) {
            finalPower += Phaser.Math.Between(-10, 10);
        } else if (this.level === 2) {
            finalPower += Phaser.Math.Between(-3, 3);
        }
        this.shoot(finalPower);
        this.searchedAngle = false;
        this.body.isStatic = false;
        this.state = 'waiting';
    }

    private setTarget(): Tank {
        const options: Tank[] = this.scene.players.filter(p => p !== this);
        let target: Tank = options[Math.floor(Math.random() * options.length)];

        switch (this.level) {
            case 2:
                target = this.getClosestPlayer(options);
                break;
            case 3:
                const visibleOptions = options.filter(t => this.canSee(t));
                if (visibleOptions.length > 0) {
                    target = this.getClosestPlayer(visibleOptions);
                } else {
                    target = this.getClosestPlayer(options);
                }
                break;
        }

        const isEnemyRight = target.body.position.x > this.body.position.x;
        const sideLimit = isEnemyRight ? Math.PI / 8 : -9 * Math.PI / 8;
        const upLimit = -Math.PI / 2;
        if (this.level === 3) this.canonAngle = Phaser.Math.FloatBetween(upLimit, sideLimit);
        else this.canonAngle = isEnemyRight ? - Math.PI / 4 : - 3 * Math.PI / 4;
        return target;
    }

    private getClosestPlayer(options: Tank[]): Tank {
        const x = this.body.position.x;
        const y = this.body.position.y;
        const closenessThreshold = 100;

        return options.sort((a, b) => {
            const distA = Phaser.Math.Distance.Between(x, y, a.body.position.x, a.body.position.y);
            const distB = Phaser.Math.Distance.Between(x, y, b.body.position.x, b.body.position.y);
            const distDiff = Math.abs(distA - distB);
            if (distDiff < closenessThreshold) {
                return a.health - b.health;
            }

            return distA - distB;
        })[0];
    }

    private findBestPosition(): number {
        const currentX = this.body.position.x;
        const maxDistance = this.fuel / this.fuelCost;
        const enemy = this.target;
        const range = this.fuel / this.fuelCost;
        const dangerThreshold = 150;
        let finalPoint: number = currentX;

        switch (this.level) {
            case 1:
                if (Math.random() > 0.25) break;
                const targetX = this.body.position.x + Phaser.Math.Between(-range, range);
                finalPoint = Phaser.Math.Clamp(targetX, 50, this.scene.scale.width - 50);
                break;
            case 2:
                const lastImpact = this.scene.lastGlobalImpact;
                const isNearImpact = lastImpact && Math.abs(lastImpact.x - currentX) < dangerThreshold;
                finalPoint = (() => {
                    let final;
                    let attempts = 0;
                    do {
                        final = this.body.position.x + Phaser.Math.Between(-range, range);
                        final = Phaser.Math.Clamp(final, 50, this.scene.scale.width - 50);
                        const distToImpact = lastImpact ? Math.abs(final - lastImpact.x) : Infinity;
                        attempts++;
                        if (isNearImpact && distToImpact < dangerThreshold) continue;
                    } while (!this.canReach(final) && attempts < 15);
                    return (attempts < 15) ? final : currentX;
                })();
                break;
            case 3:
                let bestScore = -Infinity;
                const step = 40;
                for (let x = currentX - range; x <= currentX + range; x += step) {
                    let testX = Phaser.Math.Clamp(x, 50, this.scene.scale.width - 50);
                    if (!this.canReach(testX)) continue;

                    const testY = this.getTerrainHeight(testX) - 20;
                    let currentScore = 0;
                    const angle = Math.abs(this.scene.terrainManager.getAngleAtX(testX));
                    const terrainY = this.getTerrainHeight(testX);

                    // ANTI-IMPACTOS
                    this.scene.lastImpacts.forEach((impactPos, playerLabel) => {
                        const dist = Math.abs(testX - impactPos.x);
                        if (dist < dangerThreshold) {
                            currentScore -= (dangerThreshold - dist) * 15;
                        }
                    });

                    // ANTI-PENDIENTES
                    currentScore -= (angle * 500);

                    // ANTI-POZOS
                    const leftY = this.getTerrainHeight(testX - 40);
                    const rightY = this.getTerrainHeight(testX + 40);
                    if (terrainY > leftY + 20 && terrainY > rightY + 20) {
                        currentScore -= 1000;
                    }

                    // ALTURA
                    const heightBonus = (this.scene.scale.height - testY) * 5;
                    currentScore += heightBonus;

                    // OFENSIVO
                    if (this.target && this.canSeeFrom(testX, testY, this.target)) {
                        currentScore += 1000;
                    }

                    // SIGILO
                    this.scene.players.forEach(p => {
                        if (p === this || p === this.target) return;
                        const dist = Phaser.Math.Distance.Between(testX, testY, p.body.position.x, p.body.position.y);
                        if (!p.checkLineOfSight(p.body.position.x, p.body.position.y - 20, testX, testY)) {
                            currentScore += (20000 / dist);
                        } else {
                            if (dist < 400) currentScore -= 500;
                        }
                    });
                    if (currentScore > bestScore) {
                        bestScore = currentScore;
                        finalPoint = testX;
                    }
                }
                break;
        }
        return finalPoint;
    }

    private canReach(targetX: number): boolean {
        const currentX = this.body.position.x;

        const maxSlopeAngle = Phaser.Math.DegToRad(50);
        const step = 10;
        const start = Math.min(currentX, targetX);
        const end = Math.max(currentX, targetX);

        for (let x = start; x <= end; x += step) {
            const slope = Math.abs(this.getGroundAngle(x));

            if (slope > maxSlopeAngle) {
                return false;
            }
        }

        const terrainDist = this.scene.terrainManager.getTerrainDistance(currentX, targetX);
        const fuelNeeded = terrainDist * this.fuelCost;
        if (this.fuel < (fuelNeeded * 1.05)) return false;

        const minX = Math.min(currentX, targetX);
        const maxX = Math.max(currentX, targetX);

        const tankWidth = 80;
        const safetyMargin = 10;

        const isBlocked = this.scene.players.some(p => {
            if (p === this) return false;

            const otherX = p.body.position.x;

            const inPath = (otherX > minX && otherX < maxX);

            const destinationOccupied = Math.abs(otherX - targetX) < (tankWidth / 2 + safetyMargin);

            return inPath || destinationOccupied;
        });

        return !isBlocked;
    }

    private findBestPower(angle: number): number {
        if (!this.target) return 0;

        let validPowers: number[] = [];
        let bestPower = 0;
        let minDistance = Infinity;

        const targetX = this.target.body.position.x;
        const targetY = this.target.body.position.y;
        const precision = this.level === 3 ? 1 : 5;

        for (let p = 10; p <= 150; p += precision) {
            const impact = this.simulateShot(angle, p);
            if (!impact) continue;

            if (impact.hitTank) {
                validPowers.push(p);
            } else {
                let distance = Phaser.Math.Distance.Between(impact.x, impact.y, targetX, targetY);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestPower = p;
                }
            }
        }

        if (validPowers.length > 0) {
            let bestSequence: number[] = [];
            let currentSequence: number[] = [validPowers[0]];

            for (let i = 1; i < validPowers.length; i++) {
                if (validPowers[i] === validPowers[i - 1] + precision) {
                    currentSequence.push(validPowers[i]);
                } else {
                    if (currentSequence.length > bestSequence.length) {
                        bestSequence = currentSequence;
                    }
                    currentSequence = [validPowers[i]];
                }
            }
            if (currentSequence.length > bestSequence.length) {
                bestSequence = currentSequence;
            }

            const middleIndex = Math.floor(bestSequence.length / 2);
            return bestSequence[middleIndex];
        }

        if (minDistance <= 30) {
            return bestPower;
        }

        return 0;
    }

    public simulateShot(angle: number, power: number): { x: number, y: number, hitTank: boolean } | null {
        const gravity = 0.28;
        const barrelLen = this.barrel.displayWidth;
        const localMuzzleX = Math.cos(angle) * barrelLen;
        const localMuzzleY = this.barrel.y + Math.sin(angle) * barrelLen;
        const tankRotation = this.container.rotation;

        let px = this.container.x + (localMuzzleX * Math.cos(tankRotation) - localMuzzleY * Math.sin(tankRotation));
        let py = this.container.y + (localMuzzleX * Math.sin(tankRotation) + localMuzzleY * Math.cos(tankRotation));

        const globalAngle = tankRotation + angle;
        let vx = Math.cos(globalAngle) * (power / 5);
        let vy = Math.sin(globalAngle) * (power / 5);

        for (let i = 0; i < 300; i++) {
            vy += gravity;
            px += vx;
            py += vy;

            if (this.target && i > 5) {
                if (this.scene.matter.containsPoint(this.target.body, px, py)) {
                    return { x: px, y: py, hitTank: true };
                }
            }

            if (i > 5) {
                const groundY = this.getTerrainHeight(px);
                if (py > groundY) {
                    if (i < 10) return null;
                    return { x: px, y: py, hitTank: false };
                }
            }
        }
        return { x: px, y: py, hitTank: false };
    }

    private alignCanon(angle: number): boolean {
        if (this.moveMode) {
            this.toggleMode();
            return false;
        }
        const diff = Phaser.Math.Angle.Wrap(angle - this.currentBarrelRotation);

        if (Math.abs(diff) < 0.02) {
            this.currentBarrelRotation = angle;
            this.barrel.rotation = angle;
            return true;
        }
        const direction = diff > 0 ? 'right' : 'left';
        this.rotateCanon(direction);
        return false;
    }

    private isStable(): boolean {
        const velocityThreshold = 0.2;     // Px / frame
        const angularThreshold = 0.02;     // Rads / frame

        const isPhysicallyMoving = Math.abs(this.body.velocity.x) > velocityThreshold ||
            Math.abs(this.body.velocity.y) > velocityThreshold;

        const isPhysicallyRotating = Math.abs(this.body.angularVelocity) > angularThreshold;

        const isAligningWithGround = this.rotating;

        return !isPhysicallyMoving && !isPhysicallyRotating && !isAligningWithGround;
    }
}
