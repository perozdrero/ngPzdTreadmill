
const stopThresholdDefault = 0.3;
const bounceDeceleration = 0.04;
const bounceAcceleration = 0.11;



export class Impetus {
    private boundXmin: number;
    private boundXmax: number;
    private boundYmin: number;
    private boundYmax: number;
    private pointerLastX: number;
    private pointerLastY: number;
    private pointerCurrentX: number;
    private pointerCurrentY: number;
    private pointerId: number;
    private decVelX: number;
    private decVelY: number;
    private targetX: number;
    private targetY: number;
    // private set targetY (v: number) {
    //     console.log('traget Y ', v);
    //     this._targetY = v;
    // }
    // private get targetY (): number {
    //     return this._targetY;
    // }
    private stopThreshold: number;
    private ticking: boolean;
    private pointerActive: boolean;
    private paused: boolean;
    private decelerating: boolean;
    private trackingPoints: {x: number, y: number, time: number}[];
    constructor(
        // private sourceEl: HTMLElement,
        private updateCallback: (targetX: number, targetY: number) => void,
        private multiplier: number,
        private friction: number,
        private initialValues: number[],
        private boundX: number[],
        private boundY: number[],
        private resetImpetus: () => void,
        private attachListenrs: () => void,
        private removeListeners: () => void
    ) {
        // this.bounce = this.bounce || true;
        this.multiplier = this.multiplier || 1;
        this.friction = this.friction || 0.92;

        this.targetX = 0;
        this.targetY = 0;
        this.stopThreshold = stopThresholdDefault * multiplier;
        this.ticking = false;
        this.pointerActive = false;
        this.paused = false;
        this.decelerating = false;
        this.trackingPoints = [];


        /**
         * Initialize instance
         */

        if (!updateCallback) {
            throw new Error('IMPETUS: update function not defined.');
        }

        if (initialValues) {
            if (initialValues[0]) {
                this.targetX = initialValues[0];
            }
            if (initialValues[1]) {
                this.targetY = initialValues[1];
            }
            //  this.callUpdateCallback();
        }

        // Initialize bound values
        if (boundX) {
            this.boundXmin = boundX[0];
            this.boundXmax = boundX[1];
        }
        if (boundY) {
            this.boundYmin = boundY[0];
            this.boundYmax = boundY[1];
        }
    }
    /**
     * In edge cases where you may need to
     * reinstanciate Impetus on the same sourceEl
     * this will remove the previous event listeners
     */
    public destroy (): any {
        // this.sourceEl.removeEventListener('touchstart', this.onDown);
        // this.sourceEl.removeEventListener('mousedown', this.onDown);

        // however it won't "destroy" a reference
        // to instance if you'd like to do that
        // it returns null as a convinience.
        // ex: `instance = instance.destroy();`
        return null;
    }
    /**
     * Disable movement processing
     * @public
     */
    public pause () {
        this.pointerActive = false;
        this.paused = true;
    }

    /**
     * Enable movement processing
     * @public
     */
    public resume () {
        this.paused = false;
    }

    /**
     * Update the current x and y values
     * @public
     * @param {Number} x
     * @param {Number} y
     */
    public setValues (x: number, y: number) {
        if (typeof x === 'number') {
            this.targetX = x;
        }
        if (typeof y === 'number') {
            this.targetY = y;
        }
    }

    /**
     * Update the current x and y values
     * @public
     * @param {Number} x
     * @param {Number} y
     */
    // public setLastXYValues (x: number, y: number) {
        // if (typeof x === 'number') {
        //     this.pointerLastX = x;
        // }
        // if (typeof y === 'number') {
        //     this.pointerLastY = y;
        // }
    // }
    /**
     * Update the multiplier value
     * @public
     * @param {Number} val
     */
    public setMultiplier (val: number) {
        this.multiplier = val;
        this.stopThreshold = stopThresholdDefault * this.multiplier;
    }

    /**
     * Update boundX value
     * @public
     * @param {Number[]} boundX
     */
    public setBoundX (boundX: number[]) {
        this.boundXmin = boundX[0];
        this.boundXmax = boundX[1];
    }

    /**
     * Update boundY value
     * @public
     * @param {Number[]} boundY
     */
    public setBoundY (boundY: number[]) {
        this.boundYmin = boundY[0];
        this.boundYmax = boundY[1];
    }
    public getBoundY (): number {
        return this.boundYmax;
    }
    public getY(): number {
        return this.targetY;
    }
    /**
     * Executes the update function
     */
    private callUpdateCallback() {
        // if (this.targetY > 0) {
            // console.log('Call update call back ' + this.targetY);
            this.updateCallback(this.targetX, this.targetY);
            // callfn(this.targetX, this.targetY);
        // }
    }
        /**
     * Creates a custom normalized event object from touch and mouse events
     * @param  {Event} ev
     * @returns {Object} with x, y, and id properties
     */
    private normalizeEvent(ev: any): {x: number, y: number, id: number} {
        if (ev.type === 'wheel') {
            // console.log('Wheel',  ev.clientY );
            return {
                x:  0,
                y:  ev.clientY,
                id: null
            };
        }
        // console.log('Hammerjs ' , - ev.changedPointers[0].clientY);
        return {
            x:  0,
            y: - ev.changedPointers[0].clientY,
            id: null
        };
    }

    /**
     * Initializes movement tracking
     * @param  {Object} ev Normalized event
     */
    onDown(ev: any) {
        this.resetImpetus();
        // console.log('Ondown ', ev);
        const event = this.normalizeEvent(ev);
        if (!this.pointerActive && !this.paused) {
            this.pointerActive = true;
            this.decelerating = false;
            this.pointerId = <number>event.id;
            this.pointerLastX = this.pointerCurrentX = event.x;
            this.pointerLastY = this.pointerCurrentY  = event.y;
            this.trackingPoints = [];
            this.addTrackingPoint(this.pointerLastX, this.pointerLastY);
            this.attachListenrs();
            // console.log('%%% this.pointerLastX, this.pointerLastY ', this.pointerLastX, this.pointerLastY);
        }
    }
    /**
     * Handles move events
     * @param  {Object} ev Normalized event
     */
    onMove(ev: any) {
        // console.log('Onmove ', ev);
        ev.preventDefault();
        const event = this.normalizeEvent(ev);

        if (this.pointerActive && event.id === this.pointerId) {
            this.pointerCurrentX = event.x;
            this.pointerCurrentY = event.y;
            this.addTrackingPoint(this.pointerLastX, this.pointerLastY);
            this.requestTick();
        }
    }

    /**
     * Handles up/end events
     * @param {Object} ev Normalized event
     */
    onUp(ev: any) {
        // console.log('Onup ', ev);
        const event = this.normalizeEvent(ev);

        if (this.pointerActive && event.id === this.pointerId) {
            this.stopTracking();
        }
    }

    /**
     * Stops movement tracking, starts animation
     */
    stopTracking() {
        this.pointerActive = false;
        this.addTrackingPoint(this.pointerLastX, this.pointerLastY);
        this.startDecelAnim();
        this.removeListeners();
    }
        /**
     * Records movement for the last 100ms
     * @param {number} x
     * @param {number} y [description]
     */
    private addTrackingPoint(x: any, y: any) {
        const time = Date.now();
        while (this.trackingPoints.length > 0) {
            if (time - this.trackingPoints[0].time <= 100) {
                break;
            }
            this.trackingPoints.shift();
        }

        this.trackingPoints.push({x, y, time});
    }

    /**
     * Calculate new values, call update function
     */
    private updateAndRender() {
        const pointerChangeX = this.pointerCurrentX - this.pointerLastX;
        const pointerChangeY = this.pointerCurrentY - this.pointerLastY;

        this.targetX += pointerChangeX * this.multiplier;
        this.targetY += pointerChangeY * this.multiplier;

        // this.checkBounds(true);
        this.callUpdateCallback();

        this.pointerLastX = this.pointerCurrentX;
        this.pointerLastY = this.pointerCurrentY;
        this.ticking = false;
    }

    /**
     * Returns a value from around 0.5 to 1, based on distance
     * @param {Number} val
     */
    private dragOutOfBoundsMultiplier(val: number) {
        return 0.000005 * Math.pow(val, 2) + 0.0001 * val + 0.55;
    }


    /**
     * prevents animating faster than current framerate
     */
    private requestTick() {
        if (!this.ticking) {
            requestCallBackExec(() => this.updateAndRender() );
        }
        this.ticking = true;
    }

    /**
     * Initialize animation of values coming to a stop
     */
    private startDecelAnim() {
        const firstPoint = this.trackingPoints[0];
        const lastPoint = this.trackingPoints[this.trackingPoints.length - 1];

        const xOffset = lastPoint.x - firstPoint.x;
        const yOffset = lastPoint.y - firstPoint.y;
        const timeOffset = lastPoint.time - firstPoint.time;

        const D = (timeOffset / 15) / this.multiplier;

        this.decVelX = (xOffset / D) || 0; // prevent NaN
        this.decVelY = (yOffset / D) || 0;

        // const diff = this.checkBounds(undefined);

        if ((Math.abs(this.decVelX) > 1 || Math.abs(this.decVelY) > 1)) {
            this.decelerating = true;
            this.stepDecelAnim();
        }
    }
    /**
     * Animates values slowing down
     */
    private  stepDecelAnim() {
        if (!this.decelerating) {
            return;
        }

        this.decVelX *= this.friction;
        this.decVelY *= this.friction;

        this.targetX += this.decVelX;
        this.targetY += this.decVelY;

        // const diff = this.checkBounds(undefined);
        if (Math.abs(this.decVelY) > this.stopThreshold) {

            // if (diff.x !== 0) {
            //     if (diff.x > 0) {
            //         this.targetX = this.boundXmin;
            //     } else {
            //         this.targetX = this.boundXmax;
            //     }
            //     this.decVelX = 0;
            // }
            // if (diff.y !== 0) {
            //     if (diff.y > 0) {
            //         this.targetY = this.boundYmin;
            //     } else {
            //         this.targetY = this.boundYmax;
            //     }
            //     this.decVelY = 0;
            // }
            this.callUpdateCallback();
            requestCallBackExec( () => this.stepDecelAnim() );
        } else {
            // this.onEnd();
            this.decelerating = false;
        }
    }

}



/**
 * @see http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
 */
const requestCallBackExec = (function() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame ||  function(callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();
