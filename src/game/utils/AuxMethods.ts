import {Game as GameScene} from '../scenes/Game'

/**
 * Calcula la posición Y interpolada entre dos puntos usando una curva de coseno.
 * @param vFrom Altura inicial (Y)
 * @param vTo Altura final (Y)
 * @param delta Avance normalizado (0 a 1)
 */
export function interpolate(vFrom: number, vTo: number, delta: number) {
    const interpolation = (1 - Math.cos(delta * Math.PI)) * 0.5;
    return vFrom * (1 - interpolation) + vTo * interpolation;
}

/**
 * Calcula el ángulo exacto (en radianes) de la curva de interpolación en un punto dado.
 * @param vFrom Altura inicial (Y)
 * @param vTo Altura final (Y)
 * @param delta Avance normalizado (0 a 1)
 * @param segmentLength La distancia horizontal (X) total entre el punto inicial y final
 */
export function getInterpolationAngle(vFrom: number, vTo: number, delta: number, segmentLength: number): number {
    const derivative = (vTo - vFrom) * ((Math.PI * Math.sin(delta * Math.PI)) / (2 * segmentLength));
    return Math.atan(derivative);
}

export function mark(scene: GameScene, ...args: any[]) {
    const [x, y, color = 0xff0000] = args;
    const g: Phaser.GameObjects.Graphics = scene.add.graphics();
    g.fillStyle(color, 1);
    g.fillCircle(x, y, 3);
    g.lineStyle(1, 0xffffff);
    g.strokeCircle(x, y, 3);
    
    scene.time.delayedCall(3000, () => g.destroy());
};