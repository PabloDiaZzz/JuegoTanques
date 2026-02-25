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
        // 1. Limpiamos proyectiles antiguos si quedan
        this.scene.projectiles.forEach(p => {
            p.turnSwitched = true;
            p.destroy();
        });
        this.scene.projectiles = [];

        // 2. Calculamos el siguiente índice
        this.index = (this.index + 1) % this.players.length;

        // 3. Activamos al nuevo jugador
        const currentPlayer = this.getCurrentPlayer();
        currentPlayer.canShoot = true;

        // 4. Actualizamos el UI de la escena
        this.scene.updateTurnText(`Turno: ${currentPlayer.body.label}`);
    }

    public removePlayer(tank: Tank) {
        const index = this.players.indexOf(tank);
        if (index !== -1) {
            this.players.splice(index, 1);
            // Si el jugador eliminado era el actual, ajustamos el índice
            if (index <= this.index && this.index > 0) {
                this.index--;
            }
        }
    }

    public getPlayerCount(): number {
        return this.players.length;
    }
}