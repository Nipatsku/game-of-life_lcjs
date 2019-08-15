
// https://stackoverflow.com/questions/9614109/how-to-calculate-an-angle-from-points
/**
 * Calculate angle between 2x 2D points.
 * @param   { x1, y1 } **from**
 * @param   { x2, y2 } **to**
 * @return  [0, 360] deg
 */
export const angDeg = (x1: number, y1: number, x2: number, y2: number): number => {
    const dy = y2 - y1
    const dx = x2 - x1
    let theta = Math.atan2(dy, dx); // range (-PI, PI]
    theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
    if (theta < 0) theta = 360 + theta; // range [0, 360)
    return theta
}
