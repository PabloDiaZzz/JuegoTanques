import Tank from '../entities/Tank';
import { Game as GameScene } from '../scenes/Game';

export default class PlayerManager {
    private scene: GameScene;

    constructor(scene: GameScene) {
        this.scene = scene;
    }

    public createPlayers(): Tank[] {
        const players: Tank[] = [];

        players.push(new Tank(this.scene, 200, 0xff0000, 'Jugador Rojo'));
        players.push(new Tank(this.scene, 900, 0x00ff00, 'Jugador Verde'));
        players.push(new Tank(this.scene, 1200, 0x0000ff, 'Jugador Azul'));

        return players;
    }
}