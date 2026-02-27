import Phaser from 'phaser';
import { Game as GameScene } from '../scenes/Game';
import Tank from '../entities/Tank';

export default class TurnManager {
    private scene: GameScene;
    private players: Tank[];
    private index: number = 0;

    constructor(scene: GameScene, players: Tank[]) {
        this.scene = scene;
        this.players = players;
    }

    public getCurrentPlayer(): Tank {
        return this.players[this.index];
    }

    public nextTurn() {
        this.scene.projectiles.forEach(p => {
            p.turnSwitched = true;
            p.destroy();
        });
        this.scene.projectiles = [];
        this.index = (this.index + 1) % this.players.length;
        const currentPlayer = this.getCurrentPlayer();
        currentPlayer.canShoot = true;
        this.scene.updateTurnText(`Turno: ${currentPlayer.body.label}`);
    }

    public removePlayer(tank: Tank) {
        const index = this.players.indexOf(tank);
        if (index !== -1) {
            this.players.splice(index, 1);
            if (index <= this.index && this.index > 0) {
                this.index--;
            }
        }
    }

    public getPlayerCount(): number {
        return this.players.length;
    }
}