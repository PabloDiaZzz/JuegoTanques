import Phaser from 'phaser';
import { Game as GameScene } from '../scenes/Game';

export default class InputManager {
    private scene: GameScene;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys: { [key: string]: Phaser.Input.Keyboard.Key };

    constructor(scene: GameScene) {
        this.scene = scene;
        this.cursors = scene.input.keyboard!.createCursorKeys();
        this.keys = this.scene.input.keyboard!.addKeys('A,D') as { [key: string]: Phaser.Input.Keyboard.Key };
        this.scene.input.mouse?.disableContextMenu();
        this.setupKeyboardEvents()
    }

    private setupKeyboardEvents() {
        this.scene.input.keyboard!.on('keydown-SPACE', () => {
            const turn = this.scene.currentTurn;
            if (turn && turn.canShoot) {
                turn.toggleMode();
            }
        });

        this.scene.input.keyboard!.on('keydown-UP', () => {
            const turn = this.scene.currentTurn;
            if (turn && turn.canShoot) {
                turn.shoot(turn.power);
            }
        });

        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                const turn = this.scene.currentTurn;
                if (turn && turn.canShoot) {
                    turn.shoot(turn.power);
                }
            }
        });

        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                const turn = this.scene.currentTurn;
                if (turn && turn.canShoot) {
                    turn.toggleMode();
                }
            }
        });

        this.scene.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, dX: number, dY: number) => {
            const turn = this.scene.currentTurn;
            if (!turn || !turn.canShoot || turn.moveMode) return;
            const sensibilidad = 1;
            for (let i = 0; i < sensibilidad; i++) {
                turn.control(dY > 0 ? 'right' : 'left');
            }
        });
    }

    public update() {
        const turn = this.scene.currentTurn;

        if (!turn || !turn.canShoot) return;

        if (this.cursors.left.isDown || this.keys.A.isDown) {
            turn.control('left');
        } else if (this.cursors.right.isDown || this.keys.D.isDown) {
            turn.control('right');
        }
    }
}