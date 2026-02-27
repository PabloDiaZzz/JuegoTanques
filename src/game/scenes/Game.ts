import Phaser from 'phaser';
import { Scene } from 'phaser';
import Tank from '../entities/Tank';
import Projectile from '../entities/Projectile';
import InputManager from '../managers/InputManager';
import TerrainManager from '../managers/TerrainManager';
import PlayerManager from '../managers/PlayerManager';
import TurnManager from '../managers/TurnManager';
import { mark as markPoint } from '../utils/AuxMethods'
import Slider from '../ui/Slider';

export class Game extends Scene {
    public players: Tank[] = [];
    public projectiles: Projectile[] = [];
    public terrainBody!: MatterJS.BodyType[];
    public terrainManager!: TerrainManager;
    public turnManager!: TurnManager;
    private textoTurno!: Phaser.GameObjects.Text;
    private inputManager!: InputManager;
    private playerManager!: PlayerManager;
    private powerSlider!: Slider;

    constructor() {
        super('Game');
    }

    create() {
        window.scene = this;
        this.inputManager = new InputManager(this);
        this.terrainManager = new TerrainManager(this);
        this.playerManager = new PlayerManager(this);
        this.cameras.main.setZoom(0.7);
        this.cameras.main.centerOn(this.scale.width / 2, this.scale.height / 2);
        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
        this.terrainBody = this.terrainManager.createTerrain();
        this.players = this.playerManager.createPlayers();
        this.turnManager = new TurnManager(this, this.players);
        this.textoTurno = this.add.text(10, 10, 'Turno: ' + this.turnManager.getCurrentPlayer().body.label, { color: '#ffffff' });
        this.powerSlider = new Slider(this, 50, 80, 200, 150, (value) => {
            if (this.currentTurn) {
                this.currentTurn.power = value;
            }
        });
        this.powerSlider.setValue(this.currentTurn.power);
        this.setupCollisions();
    }

    get currentTurn(): Tank {
        return this.turnManager.getCurrentPlayer();
    }

    mark = (...args: any[]) => markPoint(this, ...args);

    update() {
        this.inputManager.update();
        this.players.forEach(player => player.update());
        if (this.turnManager.getPlayerCount() === 1) {
            this.scene.start('GameOver', { winner: this.players[0].body.label, color: this.players[0].bodyColor });
        }
    }

    updateTurnText(text: string) {
        this.textoTurno.setText(text);
    }

    switchTurn() {
        this.turnManager.nextTurn();
        this.powerSlider.setValue(this.currentTurn.power);
    }

    spawnProjectile(x: number, y: number, angle: number, power: number) {
        this.projectiles.push(new Projectile(this, x, y, angle, power));
    }

    private setupCollisions() {
        this.matter.world.on('collisionstart', (event: any) => {
            event.pairs.forEach((pair: any) => {
                this.handleProjectileCollision(pair);
            });
        });
    }

    private handleProjectileCollision(pair: any) {
        const { bodyA, bodyB } = pair;

        if (bodyA.label === 'bullet' || bodyB.label === 'bullet') {
            const bulletBody = bodyA.label === 'bullet' ? bodyA : bodyB as MatterJS.BodyType;
            const targetBody = bodyA.label === 'bullet' ? bodyB : bodyA as TankBody;

            const projectileInstance = bulletBody.gameObject ? bulletBody.gameObject.unit : null;

            if (targetBody.unit instanceof Tank) {
                const tank = targetBody.unit;
                if (tank && tank.takeDamage) {
                    tank.takeDamage(25);
                    console.log(`¡Hit! HP de ${targetBody.label}: ${tank.heal}`);
                }
            }

            if (projectileInstance && !projectileInstance.turnSwitched) {
                projectileInstance.safeSwitchTurn();
            }
        }
    }
}
