import Phaser from 'phaser';
import { Game as GameScene } from "../scenes/Game";
import { interpolate } from '../utils/AuxMethods';

export default class TerrainManager {
    public terrainPoints: { x: number, y: number }[] = [];
    public terrainVisual!: Phaser.GameObjects.Graphics;

    private scene: GameScene;
    private terrainBodies: MatterJS.BodyType[] = [];
    private terrainSteps: number = 5;

    constructor(scene: GameScene) {
        this.scene = scene;
    }

    public createTerrain(existingPoints?: { x: number, y: number }[]): MatterJS.BodyType[] {
        if (existingPoints) {
            this.terrainPoints = existingPoints.map(p => ({ ...p }));
        } else {
                const width = this.scene.scale.width * 2;
                const groundLevel = 600;
                const amplitude = 200;
                const slopeLengthRange = [200, 450];

                const points = [];
                let currentX = 0;
                let slopeStartHeight = Math.random();
                let slopeEndHeight = Math.random();
                let slopeStart = 0;
                let currentSlopeLength = Phaser.Math.Between(slopeLengthRange[0], slopeLengthRange[1]);
                let slopeEnd = currentSlopeLength;

                while (currentX <= width + 40) {
                    if (currentX >= slopeEnd) {
                        slopeStartHeight = slopeEndHeight;
                        slopeEndHeight = Math.random();
                        slopeStart = currentX;
                        currentSlopeLength = Phaser.Math.Between(slopeLengthRange[0], slopeLengthRange[1]);
                        slopeEnd += currentSlopeLength;
                    }
                    const delta = (currentX - slopeStart) / (slopeEnd - slopeStart);
                    const y = groundLevel + interpolate(slopeStartHeight, slopeEndHeight, delta) * amplitude;

                    points.push({ x: currentX, y: y });
                    currentX += this.terrainSteps;
                }
                this.terrainPoints = points;
            }
            this.terrainVisual = this.scene.add.graphics();
            this.updateTerrainPhysicsAndVisuals();

            return this.terrainBodies;
        }

    public createCrater(impactX: number, impactY: number, radius: number = 70, depthFactor: number = 0.7): void {
        let changed = false;

        const angle = this.getAngleAtX(impactX);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const horizontalRadius = radius;
        const depthRadius = radius * depthFactor;

        // Coeficientes para hacer un elipse
        const a_coeff = (Math.pow(sinA, 2) / Math.pow(horizontalRadius, 2)) + (Math.pow(cosA, 2) / Math.pow(depthRadius, 2));
        const b_factor = 2 * sinA * cosA * ((1 / Math.pow(horizontalRadius, 2)) - (1 / Math.pow(depthRadius, 2)));
        const c_base = (Math.pow(cosA, 2) / Math.pow(horizontalRadius, 2)) + (Math.pow(sinA, 2) / Math.pow(depthRadius, 2));

        for (let i = 0; i < this.terrainPoints.length; i++) {
            const p = this.terrainPoints[i];
            const dx = p.x - impactX;

            // Solo procesamos los puntos cercanos al impacto
            if (Math.abs(dx) > radius * 1.5) continue;

            // Ecuación: A*y² + B*y + C = 1 (donde y es relativo al impacto)
            const k2 = dx * b_factor;
            const k3 = Math.pow(dx, 2) * c_base - 1;

            const discriminant = Math.pow(k2, 2) - 4 * a_coeff * k3;

            // Si es positivo el punto esta dentro de la elipse
            if (discriminant >= 0) {
                // Elegimos la solucion positiva porque +y = +profundidad
                const relativeY = (-k2 + Math.sqrt(discriminant)) / (2 * a_coeff);
                const targetY = impactY + relativeY;

                if (targetY > p.y) {
                    p.y = targetY;
                    changed = true;
                }
            }
        }

        if (changed) {
            this.updateTerrainPhysicsAndVisuals();
        }
    }

    private updateTerrainPhysicsAndVisuals(): void {
        this.terrainVisual.clear();

        this.terrainBodies.forEach(body => this.scene.matter.world.remove(body));
        this.terrainBodies = [];

        const width = this.scene.scale.width * 2;
        const height = this.scene.scale.height * 2;

        this.terrainVisual.fillStyle(0x654b35, 1);
        this.terrainVisual.beginPath();
        this.terrainVisual.moveTo(0, height);
        this.terrainPoints.forEach(p => this.terrainVisual.lineTo(p.x, p.y));
        this.terrainVisual.lineTo(width, height);
        this.terrainVisual.lineTo(0, height);
        this.terrainVisual.closePath();
        this.terrainVisual.fillPath();

        this.terrainVisual.lineStyle(10, 0x6b9b1e);
        this.terrainVisual.beginPath();
        this.terrainVisual.moveTo(this.terrainPoints[0].x, this.terrainPoints[0].y);
        this.terrainPoints.forEach(p => this.terrainVisual.lineTo(p.x, p.y));
        this.terrainVisual.strokePath();

        const rectHeight = 10;
        for (let i = 0; i < this.terrainPoints.length - 1; i++) {
            const p1 = this.terrainPoints[i];
            const p2 = this.terrainPoints[i + 1];

            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            const yOffset = (rectHeight / 2) - 2;

            const body = this.scene.matter.add.rectangle(midX, midY + yOffset, distance, rectHeight, {
                isStatic: true,
                angle: angle,
                label: 'ground',
                friction: 1
            });

            this.terrainBodies.push(body as MatterJS.BodyType);
        }
    }

    public getHeightAtX(targetX: number): number {
        const index = Math.floor(targetX / 5);
        if (index < 0) return this.terrainPoints[0]?.y || 600;
        if (index >= this.terrainPoints.length - 1) {
            return this.terrainPoints[this.terrainPoints.length - 1]?.y || 600;
        }
        const p1 = this.terrainPoints[index];
        const p2 = this.terrainPoints[index + 1];
        const t = (targetX - p1.x) / (p2.x - p1.x);
        return p1.y + t * (p2.y - p1.y);
    }

    public getAngleAtX(targetX: number): number {
        const index = Math.floor(targetX / 5);
        if (index >= 0 && index < this.terrainPoints.length - 1) {
            const p1 = this.terrainPoints[index];
            const p2 = this.terrainPoints[index + 1];
            return Math.atan2(p2.y - p1.y, p2.x - p1.x);
        }
        return 0;
    }

    public getTerrainDistance(x1: number, x2: number): number {
        const startX = Math.min(x1, x2);
        const endX = Math.max(x1, x2);
        let totalDistance = 0;
        const steps = this.terrainSteps;

        for (let x = startX; x < endX; x += steps) {
            const nextX = Math.min(x + steps, endX);
            const y1 = this.getHeightAtX(x);
            const y2 = this.getHeightAtX(nextX);

            totalDistance += Phaser.Math.Distance.Between(x, y1, nextX, y2);
        }

        return totalDistance;
    }
}