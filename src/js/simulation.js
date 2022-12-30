let time = Date.now();
let lastTime = time;
let deltaTime = 0;

class Simulation {
    constructor(initData) {
        this.lifetime = 0;
        this.settings = initData.settings;
        this.grid = new Grid(initData);
        this.ecosystem = new Ecosystem(this.grid);
    }

    start() {
        setInterval(this._loop.bind(this), 1000);
    }

    spawnLifeform(row, col, type) {

    }

    _loop() {
        time = Date.now();
        deltaTime = time - lastTime;
        for (let i = 0; i < NUM_TICKS_PER_FRAME; i++) {
            if (this.lifetime % SIM_FRAME_MOD == 0) {
                this.ecosystem.update();
                this.lifetime++;
            }
        }
        this.onCompleteFrame();
        lastTime = time;
    }

    get result() {
        return this.grid.result;
    }

    get frameData() {
        return [this.lifetime, this.result];
    }
}