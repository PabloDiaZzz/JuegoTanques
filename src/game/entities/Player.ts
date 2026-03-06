import Tank from "./Tank";
import { Game as GameScene } from '../scenes/Game';

export default class Player extends Tank {
    
    constructor(scene: GameScene, x: number, color: number, label: string) {
        super(scene, x, color, label);
    }
}