import Phaser from 'phaser';
import { Game as GameScene } from "../scenes/Game";
import { interpolate } from '../utils/AuxMethods';

export default class TerrainManager {
    private scene: GameScene;
    private terrainVisual!: Phaser.GameObjects.Graphics;

    public terrainPoints: { x: number, y: number }[] = [];

    constructor(scene: GameScene) {
        this.scene = scene;
    }

    public createTerrain(): MatterJS.BodyType[] {
        const bodies: MatterJS.BodyType[] = [];
        const width = this.scene.scale.width * 2;
        const height = this.scene.scale.height * 2;
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
            currentX += 5;
        }

        this.terrainPoints = points;

        this.terrainVisual = this.scene.add.graphics();
        this.terrainVisual.fillStyle(0x654b35, 1);
        this.terrainVisual.beginPath();
        this.terrainVisual.moveTo(0, height);
        points.forEach(p => this.terrainVisual.lineTo(p.x, p.y));
        this.terrainVisual.lineTo(width, height);
        this.terrainVisual.lineTo(0, height);
        this.terrainVisual.closePath();
        this.terrainVisual.fillPath();

        // Línea de césped superior
        this.terrainVisual.lineStyle(10, 0x6b9b1e);
        this.terrainVisual.beginPath();
        this.terrainVisual.moveTo(points[0].x, points[0].y);
        points.forEach(p => this.terrainVisual.lineTo(p.x, p.y));
        this.terrainVisual.strokePath();

        const rectHeight = 100;

        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];

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

            bodies.push(body as MatterJS.BodyType);
        }

        return bodies;
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
}