import * as Phaser from 'phaser';
import type { Game as GameScene } from '../game/scenes/Game';
import type Tank from '../game/entities/Tank';

declare global {
    type TankBody = MatterJS.BodyType & { unit?: Tank };

    interface Window {
        scene: GameScene;
        game: Phaser.Game;
    }

    interface ProjectileVisual extends Phaser.GameObjects.Arc, Phaser.Physics.Matter.Components.Velocity {
        unit?: Projectile;
    }
}

export { };