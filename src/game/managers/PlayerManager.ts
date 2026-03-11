import CPU from '../entities/Cpu';
import Player from '../entities/Player';
import Tank from '../entities/Tank';
import { Game as GameScene } from '../scenes/Game';

export default class PlayerManager {
    private scene: GameScene;

    constructor(scene: GameScene) {
        this.scene = scene;
    }

    public createPlayers(configs?: any[]): Tank[] {
        const players: Tank[] = [];

        const finalConfigs = configs || [
            { name: 'CPU Rojo', level: 1, x: 200, color: 0xff0000 },
            { name: 'CPU Verde', level: 2, x: 900, color: 0x00ff00 },
            { name: 'CPU Azul', level: 3, x: 1200, color: 0x0000ff },
            { name: 'CPU Negro', level: 2, x: 1500, color: 0x000000 }
        ];

        finalConfigs.forEach(config => {
            if (config.level === 0) {
                players.push(new Player(this.scene, config.x, config.color, config.name));
            } else {
                const cpu = new CPU(this.scene, config.x, config.color, config.name);
                cpu.level = config.level;
                players.push(cpu);
            }
        });

        return players;
    }
}