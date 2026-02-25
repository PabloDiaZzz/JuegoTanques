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