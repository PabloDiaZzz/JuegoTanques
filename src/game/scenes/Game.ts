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
    private uiElements: Phaser.GameObjects.GameObject[] = []
    private uiCamera!: Phaser.Cameras.Scene2D.Camera;

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
        this.cameras.main.setZoom(0.5);
        this.cameras.main.centerOn(this.scale.width / 2, this.scale.height / 2);
        this.cameras.main.setBounds(0, 0, this.scale.width * 2, this.scale.height);
        this.terrainManager.createTerrain(this.cleanTerrainPoints || undefined);
        this.players = this.playerManager.createPlayers(this.playerConfigs || undefined);
        this.turnManager = new TurnManager(this, this.players);

        if (!this.cleanTerrainPoints) {
            this.cleanTerrainPoints = this.terrainManager.terrainPoints.map(p => ({ ...p }));
        }
        this.setupUI();
        this.updateUIVisibility();
        this.focusCameraOnTarget(this.currentTurn.container);

        this.input.keyboard!.on('keydown-ESC', () => {
            this.scene.pause();
            this.scene.launch('PauseMenu');
        });

        this.events.on('shutdown', () => {
            this.projectiles.forEach(p => p.destroy());
            this.projectiles = [];
        });
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

    public focusCameraOnTarget(target: Phaser.GameObjects.Container | Phaser.GameObjects.GameObject) {
        this.cameras.main.startFollow(target, true, 0.1, 0.1);
    }

    switchTurn() {
        this.turnManager.nextTurn();
        this.powerSlider.setValue(this.currentTurn.power);
        this.updateUIVisibility();
        this.turnTimer.reset();
        this.turnTimer.resume();
        this.focusCameraOnTarget(this.currentTurn.container);
    }

    spawnProjectile(x: number, y: number, angle: number, power: number, owner: Tank) {
        // TODO this.shoot.play();
        const projectile = new Projectile(this, x, y, angle, power, owner)
        this.projectiles.push(projectile);
        this.focusCameraOnTarget(projectile.visual);
        this.uiCamera.ignore(projectile.visual)
    }

    public updateUIVisibility(): void {
        const isHuman = this.currentTurn instanceof Player;
        this.powerSlider.setVisible(isHuman);
    }

    private setupUI() {
        const uiBottom = this.scale.height - 40;
        const uiTop = 40;
        const uiLeft = 40;
        const uiRight = this.scale.width - 40
        const btnSize = 30;
        const spacing = 10;
        const btnColor = 0x1e272e;

        // SALTAR TURNO
        const turnoBtn = new Button(this, 0x888888, uiRight - 20, uiBottom, 100, 40, 'Saltar Turno', () => {
            this.switchTurn();
        });
        this.uiElements.push(turnoBtn.container);

        // FILA SUPERIOR: CONTROLES DE ZOOM
        const lessZoomBtn = new Button(this, btnColor, uiRight - 25, uiTop - 10, btnSize, btnSize, '-', () => {
            const currentZoom = this.cameras.main.zoom;
            this.cameras.main.setZoom(Phaser.Math.Clamp(currentZoom - 0.1, 0.5, 1.5));
        });
        this.uiElements.push(lessZoomBtn.container);

        const moreZoomBtn = new Button(this, btnColor, uiRight - 25 + btnSize + spacing, uiTop - 10, btnSize, btnSize, '+', () => {
            const currentZoom = this.cameras.main.zoom;
            this.cameras.main.setZoom(Phaser.Math.Clamp(currentZoom + 0.1, 0.5, 1.5));
        });
        this.uiElements.push(lessZoomBtn.container, moreZoomBtn.container);

        // FILA INFERIOR: CONTROLES DE MOVIMIENTO MANUAL
        const leftCameraBtn = new Button(this, btnColor, uiRight - 25, uiTop - 10 + btnSize + spacing, btnSize, btnSize, '<', () => {
            this.cameras.main.stopFollow();
            this.cameras.main.scrollX -= 200;
        });

        const rightCameraBtn = new Button(this, btnColor, uiRight - 25 + btnSize + spacing, uiTop - 10 + btnSize + spacing, btnSize, btnSize, '>', () => {
            this.cameras.main.stopFollow();
            this.cameras.main.scrollX += 200;
        });
        this.uiElements.push(leftCameraBtn.container, rightCameraBtn.container);

        // BOTÓN LATERAL: VOLVER AL TANQUE ACTUAL
        const resetCameraBtn = new Button(this, btnColor, uiRight - 25 + ((btnSize + spacing) / 2), uiTop - 10 + 2 * (btnSize + spacing), 80, 30, 'CENTRAR', () => {
            this.focusCameraOnTarget(this.currentTurn.container);
            this.cameras.main.setZoom(0.7);
        });
        this.uiElements.push(resetCameraBtn.container);

        // SLIDER POTENCIA
        this.powerSlider = new Slider(this, 50, 80, 200, 150, (value) => {
            if (this.currentTurn) {
                this.currentTurn.power = value;
            }
        });
        this.powerSlider.setValue(this.currentTurn.power);
        this.uiElements.push(this.powerSlider.handle, this.powerSlider.track);

        // TIMER
        this.turnTimer = new Timer(this, this.scale.width / 2, 40, 80, 50, 20, () => {
            this.currentTurn.canShoot = false;
            this.currentTurn.fuel = 0;
            if (this.projectiles.filter(p => p.owner == this.currentTurn).length === 0) {
                this.switchTurn();
            }
        });
        this.uiElements.push(this.turnTimer.bg, this.turnTimer.timeText);

        // TEXTO TURNO
        this.textoTurno = this.add.bitmapText(20, 20, 'miFuente', 'Turno: ' + this.turnManager.getCurrentPlayer().body.label, 15).setScrollFactor(0);
        this.uiElements.push(this.textoTurno)

        this.cameras.main.ignore(this.uiElements);

        this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height).setName('UI');
        this.uiCamera.ignore([
            ...this.players.map(p => p.container),
            ...this.players.map(p => p.trajectoryGraphics),
            this.terrainManager.terrainVisual,
        ])
    }
}
