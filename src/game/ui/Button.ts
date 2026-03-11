import Phaser, { Scene } from 'phaser';

export default class Button {
    private scene: Scene;
    public container: Phaser.GameObjects.Container;
    private shadow: Phaser.GameObjects.Graphics;
    private bg: Phaser.GameObjects.Graphics;
    private text: Phaser.GameObjects.Text;
    private radius: number = 15;
    private height!: number;
    private width!: number;
    private color!: number;

    constructor(scene: Scene, color: number, x: number, y: number, width: number, height: number, text: string, onClick: () => void) {
        this.scene = scene;
        this.height = height;
        this.width = width;
        this.color = color;
        this.shadow = scene.add.graphics();
        this.shadow.fillStyle(0x000000, 0.5);
        this.shadow.fillRoundedRect(-this.width / 2 + 4, - this.height / 2 + 6, this.width, this.height, this.radius);
        this.container = scene.add.container(x, y);
        this.bg = scene.add.graphics();
        this.drawBackground(this.color);
        const calculatedFontSize = Math.floor(height * 0.4);
        this.text = scene.add.text(0, 0, text, {
            fontSize: `${calculatedFontSize}px`,
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        const textWidth = this.text.width;
        const maxWidth = width * 0.8;
        if (textWidth > maxWidth) {
            const scaleFactor = maxWidth / textWidth;
            this.text.setFontSize(Math.floor(calculatedFontSize * scaleFactor));
        }
        this.container = scene.add.container(x, y, [this.shadow, this.bg, this.text]);
        this.container.setSize(this.width, this.height);
        this.container.setInteractive({ useHandCursor: true });
        this.container.setScrollFactor(0);

        this.container.on('pointerdown', () => {
            this.drawBackground(this.color - 0x222222);
            this.bg.y = 4;
            this.text.y = 4;
            this.shadow.alpha = 0.2;
            onClick();
        });

        this.container.on('pointerup', () => {
            this.resetButtonState();
        });

        this.container.on('pointerover', () => {
            this.drawBackground(this.color - 0x111111);
        });

        this.container.on('pointerout', () => {
            this.resetButtonState();
            this.drawBackground(this.color);
        });
    }

    private drawBackground(color: number) {
        this.bg.clear();
        this.bg.fillStyle(color, 1);
        this.bg.fillRoundedRect(-this.width / 2, -this.height / 2, this.width, this.height, this.radius);
        this.bg.lineStyle(1, 0xffffff, 1);
        this.bg.strokeRoundedRect(-this.width / 2, -this.height / 2, this.width, this.height, this.radius);
    }

    private resetButtonState() {
        this.bg.y = 0;
        this.text.y = 0;
        this.shadow.alpha = 1;
        this.drawBackground(this.color - 0x111111);
    }

    public destroy() {
        this.container.destroy();
    }
}