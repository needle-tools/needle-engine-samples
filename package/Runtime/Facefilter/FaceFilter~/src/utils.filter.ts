import { Matrix4 } from 'three';


export class OneEuroFilterMatrix4 {
    private minCutoff: number;
    private beta: number;
    private dcutoff: number;
    private lastTime: number | null = null;
    private xFilter: LowPassFilter;
    private dxFilter: LowPassFilter;
    /**
     * @param minCutoff - Minimum cutoff frequency. This affects the smoothness of the filter.
     *                    Lower values result in smoother but less responsive filtering.
     *                    Higher values make the filter more responsive but potentially more jittery.
     *                    Typical range is 0.0001 to 1. Default is 1.
     * @param beta - Speed coefficient. This affects how the filter adapts to quick changes.
     *               Higher values result in faster response to quick movements, but may introduce more jitter.
     *               Lower values have a steadier response, but may feel sluggish for quick movements.
     *               Typical range is 0 to 1. Default is 0.
     * @param dcutoff - Cutoff frequency for derivative. This is usually set to 1, but you can adjust it
     *                  to change how the filter responds to changes in speed.
     *                  Lower values will make the filter more robust to sudden changes, but less responsive.
     *                  Higher values will make it more responsive, but potentially more prone to jitter.
     *                  Typical range is 0.1 to 1. Default is 1.
    **/
    constructor(minCutoff: number = 1, beta: number = 0, dcutoff: number = 1) {
        this.minCutoff = minCutoff;
        this.beta = beta;
        this.dcutoff = dcutoff;
        this.xFilter = new LowPassFilter(new Matrix4());
        this.dxFilter = new LowPassFilter(new Matrix4());
    }

    filter(matrix: Matrix4, timestamp: number): Matrix4 {
        if (this.lastTime === null) {
            this.lastTime = timestamp;
            this.xFilter.setAlpha(0);
            this.dxFilter.setAlpha(0);
            return matrix.clone();
        }

        const dt = Math.max(timestamp - this.lastTime, 1e-5);
        this.lastTime = timestamp;

        const dValue = this.subtractMatrices(matrix, this.xFilter.lastRawValue);
        const dCorrected = this.dxFilter.filterWithAlpha(dValue, this.alpha(this.dcutoff, dt));

        const cutoff = this.minCutoff + this.beta * dCorrected.elements.reduce((sum, val) => sum + Math.abs(val), 0);
        return this.xFilter.filterWithAlpha(matrix, this.alpha(cutoff, dt));
    }

    private alpha(cutoff: number, dt: number): number {
        const te = 1.0 / (2 * Math.PI * cutoff);
        return 1 / (1 + te / dt);
    }
    private subtractMatrices(a: Matrix4, b: Matrix4): Matrix4 {
        const result = new Matrix4();
        for (let i = 0; i < 16; i++) {
            result.elements[i] = a.elements[i] - b.elements[i];
        }
        return result;
    }
}

class LowPassFilter {
    lastRawValue: Matrix4;
    private lastValue: Matrix4;

    constructor(initialValue: Matrix4) {
        this.lastRawValue = initialValue.clone();
        this.lastValue = initialValue.clone();
    }

    setAlpha(alpha: number): void {
        if (alpha < 0 || alpha > 1) {
            throw new Error("alpha should be in (0, 1]");
        }
        this.lastValue.copy(this.lastRawValue);
    }

    filterWithAlpha(value: Matrix4, alpha: number): Matrix4 {
        this.lastRawValue.copy(value);
        const result = new Matrix4();
        for (let i = 0; i < 16; i++) {
            result.elements[i] = alpha * value.elements[i] + (1 - alpha) * this.lastValue.elements[i];
        }
        this.lastValue.copy(result);
        return result;
    }
}
