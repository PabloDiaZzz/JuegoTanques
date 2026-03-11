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
import Button from '../ui/Button';
import Timer from '../ui/Timer';
import Player from '../entities/Player';

export class Game extends Scene {
    public players: Tank[] = [];
    public projectiles: Projectile[] = [];
    public terrainBody!: MatterJS.BodyType[];
    public cleanTerrainPoints: { x: number, y: number }[] | null = null;
    public terrainManager!: TerrainManager;
    public turnManager!: TurnManager;
    public shoot!: Phaser.Sound.BaseSound;
    public turnTimer!: Timer;
    public lastImpacts: Map<string, Phaser.Math.Vector2> = new Map();
    public lastGlobalImpact: Phaser.Math.Vector2 | null = null;
    public playerConfigs: any[] | null = null;
    private textoTurno!: Phaser.GameObjects.BitmapText;
    private inputManager!: InputManager;
    private playerManager!: PlayerManager;
    private powerSlider!: Slider;

    constructor() {
        super('Game');
    }

    init(data: any) {
        if (data && data.initialTerrain) {
            this.cleanTerrainPoints = data.initialTerrain;
        } else {
            this.cleanTerrainPoints = null;
        }

        if (data && data.players) {
            this.playerConfigs = data.players;
        } else {
            this.playerConfigs = null;
        }
    }

    create() {
        window.scene = this;
        this.inputManager = new InputManager(this);
        this.terrainManager = new TerrainManager(this);
        this.playerManager = new PlayerManager(this);
        this.shoot = this.sound.add('shoot').setVolume(0.3);
        this.cameras.main.setZoom(0.7);
        this.cameras.main.centerOn(this.scale.width / 2, this.scale.height / 2);
        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
        this.terrainManager.createTerrain(this.cleanTerrainPoints || undefined);
        this.players = this.playerManager.createPlayers(this.playerConfigs || undefined);
        this.turnManager = new TurnManager(this, this.players);
        this.textoTurno = this.add.bitmapText(10, 10, 'miFuente', 'Turno: ' + this.turnManager.getCurrentPlayer().body.label, 20);
        this.powerSlider = new Slider(this, 50, 80, 200, 150, (value) => {
            if (this.currentTurn) {
                this.currentTurn.power = value;
            }
        });
        this.powerSlider.setValue(this.currentTurn.power);
        this.setupCollisions();

        new Button(this, 0x888888, 1600, 35, 150, 50, 'Saltar Turno', () => {
            this.switchTurn();
        if (!this.cleanTerrainPoints) {
            this.cleanTerrainPoints = this.terrainManager.terrainPoints.map(p => ({ ...p }));
        }
        this.input.keyboard!.on('keydown-ESC', () => {
            this.scene.pause();
            this.scene.launch('PauseMenu');
        });

        this.turnTimer = new Timer(this, this.scale.width / 2, -120, 80, 50, 20, () => this.switchTurn());
        this.updateUIVisibility();
    }

    get currentTurn(): Tank {
        return this.turnManager.getCurrentPlayer();
    }

    mark = (...args: any[]) => markPoint(this, ...args);

    update(time: number, delta: number) {
        if (this.turnManager.getPlayerCount() === 1) {
            this.scene.start('GameOver', { type: 'win', winner: this.players[0].body.label, color: this.players[0].bodyColor });
        }
        this.inputManager.update(delta);
        this.turnTimer.update(delta);
        this.players.forEach(player => player.update(delta));
        this.projectiles.forEach(projectile => projectile.update());
    }

    updateTurnText(text: string) {
        this.textoTurno.setText(text);
    }

    switchTurn() {
        this.turnManager.nextTurn();
        this.powerSlider.setValue(this.currentTurn.power);
        this.updateUIVisibility();
        this.turnTimer.reset();
        this.turnTimer.resume();
    }

    spawnProjectile(x: number, y: number, angle: number, power: number, owner: Tank) {
        // TODO this.shoot.play();
        this.projectiles.push(new Projectile(this, x, y, angle, power, owner));
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
            const impactPos = new Phaser.Math.Vector2(bulletBody.position.x, bulletBody.position.y);
            this.lastGlobalImpact = impactPos;

            const projectileInstance: Projectile | null = bulletBody.gameObject ? bulletBody.gameObject.unit : null;
            if (projectileInstance && projectileInstance.owner) {
                this.lastImpacts.set(projectileInstance.owner.body.label, impactPos);
            }
            if (targetBody.unit && typeof targetBody.unit.takeDamage === 'function') {
                const tank: Tank = targetBody.unit;
                tank.takeDamage(25);
                console.log(`¡Hit! HP de ${targetBody.label}: ${tank.health}`);
            } else if (targetBody.label == 'ground') {
                this.terrainManager.createCrater(bulletBody.position.x, bulletBody.position.y, 70);
            }

            if (projectileInstance && !projectileInstance.turnSwitched) {
                projectileInstance.safeSwitchTurn();
            }
            this.cameras.main.shake(100, 0.01);
        }
    }

    public updateUIVisibility(): void {
        const isHuman = this.currentTurn instanceof Player;
        this.powerSlider.setVisible(isHuman);
    }
}
