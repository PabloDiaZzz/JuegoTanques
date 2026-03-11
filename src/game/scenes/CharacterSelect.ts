import { Scene } from 'phaser';

export class CharacterSelect extends Scene {
    private playerCount = 0;

    constructor() {
        super('CharacterSelect');
    }

    create() {
        const { width, height } = this.scale;
        this.add.rectangle(0, 0, width, height, 0x171717).setOrigin(0);

        // 1. Instanciamos el HTML
        const domElement = this.add.dom(width / 2, height / 5).createFromCache('characterSelect');
        const listContainer = domElement.getChildByID('player-list') as HTMLElement;
        const template = domElement.getChildByID('player-row-template') as HTMLTemplateElement;

        const addPlayerRow = (defaultName: string, defaultColor: string) => {
            const clone = template.content.cloneNode(true) as HTMLElement;
            const row = clone.querySelector('.player-row') as HTMLElement;

            (row.querySelector('.p-name') as HTMLInputElement).value = defaultName;
            (row.querySelector('.p-color') as HTMLInputElement).value = defaultColor;

            listContainer.appendChild(row);
            this.playerCount++;
        };

        addPlayerRow('Tanque Rojo', '#ff0000');
        addPlayerRow('Tanque Verde', '#00ff00');

        // 4. Listeners para los botones
        domElement.addListener('click');
        domElement.on('click', (event: any) => {
            const target = event.target as HTMLElement;

            // BOTÓN AÑADIR JUGADOR
            if (target.id === 'add-player-btn') {
                const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                addPlayerRow(`Jugador ${this.playerCount + 1}`, randomColor);
            }

            if (target.classList.contains('delete-btn')) {
                const row = target.closest('.player-row');
                if (row && listContainer.children.length > 2) {
                    row.remove();
                    this.playerCount--;
                }
            }

            if (target.classList.contains('move-up')) {
                const row = target.closest('.player-row');
                if (row && row.previousElementSibling) {
                    listContainer.insertBefore(row, row.previousElementSibling);
                }
            }

            if (target.classList.contains('move-down')) {
                const row = target.closest('.player-row');
                if (row && row.nextElementSibling) {
                    listContainer.insertBefore(row.nextElementSibling, row);
                }
            }

            if (target.id === 'start-btn') {
                const rows = listContainer.querySelectorAll('.player-row');
                const playerConfigs: any[] = [];

                const spacing = width / (rows.length + 1);
                const totalWidth = width * 2;
                const margin = 100;
                const usableWidth = totalWidth - (margin * 2);

                rows.forEach((row, index) => {
                    const name = (row.querySelector('.p-name') as HTMLInputElement).value;
                    let levelVal = (row.querySelector('.p-type') as HTMLSelectElement).value;
                    const colorStr = (row.querySelector('.p-color') as HTMLInputElement).value;
                    const color = parseInt(colorStr.replace('#', '0x'), 16);

                    let level = 0;
                    if (levelVal === 'random') {
                        level = Phaser.Math.Between(1, 3);
                    } else {
                        level = parseInt(levelVal);
                    }

                    let x: number;
                        x = margin + (index * (usableWidth / (rows.length - 1)));

                    playerConfigs.push({
                        name: name,
                        level: level,
                        color: color,
                        x: x,
                    });
                });

                this.scene.start('Game', { players: playerConfigs });
            }
        });
    }
}