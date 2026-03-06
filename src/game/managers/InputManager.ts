import Phaser from 'phaser';
import { Game as GameScene } from '../scenes/Game';
import Player from '../entities/Player';

export default class InputManager {
    private scene: GameScene;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys: { [key: string]: Phaser.Input.Keyboard.Key };

    constructor(scene: GameScene) {
        this.scene = scene;
        this.cursors = scene.input.keyboard!.createCursorKeys();
        this.keys = this.scene.input.keyboard!.addKeys('A,D,R') as { [key: string]: Phaser.Input.Keyboard.Key };
        this.scene.input.mouse?.disableContextMenu();
        this.setupKeyboardEvents()
    }

    private setupKeyboardEvents() {
        const isPlayerTurn = () => {
            const turn = this.scene.currentTurn;
            return turn && turn.canShoot && turn instanceof Player;
        };

        this.scene.input.keyboard!.on('keydown-SPACE', () => {
            if (!isPlayerTurn()) return;
            const turn = this.scene.currentTurn;
            if (turn && turn.canShoot) {
                turn.toggleMode();
            }
        });

        this.scene.input.keyboard!.on('keydown-UP', () => {
            if (!isPlayerTurn()) return;
            const turn = this.scene.currentTurn;
            if (turn && turn.canShoot) {
                turn.shoot(turn.power);
            }
        });

        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]) => {
            if (gameObjects.length > 0) return;
            if (!isPlayerTurn()) return;
            if (pointer.rightButtonDown()) {
                const turn = this.scene.currentTurn;
                if (turn && turn.canShoot) {
                    turn.toggleMode();
                }
            } else if (pointer.leftButtonDown()) {
                const turn = this.scene.currentTurn;
                if (turn && turn.canShoot) {
                    turn.shoot(turn.power);
                }
            }
        });

        this.scene.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, dX: number, dY: number) => {
            if (!isPlayerTurn()) return;
            const turn = this.scene.currentTurn;
            if (!turn || !turn.canShoot || turn.moveMode) return;
            const sensibilidad = 1;
            for (let i = 0; i < sensibilidad; i++) {
                turn.control(dY > 0 ? 'right' : 'left', 16.66);
            }
        });

        this.scene.input.keyboard!.on('keydown-R', () => {
            this.scene.scene.restart();
        });
    }

    public update(delta: number) {
        const turn = this.scene.currentTurn;

        if (!turn || !turn.canShoot || !(turn instanceof Player)) return;

        if (this.cursors.left.isDown || this.keys.A.isDown) {
            turn.control('left', delta);
        } else if (this.cursors.right.isDown || this.keys.D.isDown) {
            turn.control('right', delta);
        }
    }
}