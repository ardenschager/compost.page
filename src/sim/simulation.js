class Ecosystem {
    constructor(grid, startTime) {
        this.grid = grid;
        this._lifeforms = [];
        this._molds = [];
        this._init(startTime);
    }

    _init(startTime) {
        this.spawn(LIFEFORM_TYPES.Mold, startTime, true);
    }

    update(time, deltaTime) {
        if (Math.random() < MOLD_SPAWN_BASE_PROB && this._molds.length < MAX_NUM_MOLDS || this._molds.length == 0) {
            this.spawn(LIFEFORM_TYPES.Mold, time);
        }
        for (const lifeform of this._lifeforms) {
            lifeform.update(deltaTime);
        }
    }

    spawn(type, spawnTime, forceSpawn=false) {
        if (type == LIFEFORM_TYPES.Mold) {
            if (this._molds.length >= MAX_NUM_MOLDS) return;            
            this._trySpawnMold(spawnTime, forceSpawn);
        }
    }

    remove(lifeform) {
        if (lifeform.type == LIFEFORM_TYPES.Mold) {
            this._molds.filter((mold) => {
                return mold !== lifeform;
            });
        }
        this._lifeforms.filter((_lifeform) => {
            return _lifeform !== lifeform;
        });
    }

    // lifeform cells are performance heavy
    get numLifeformCells() {
        let numCells = 0;
        for (let lifeform of this._lifeforms) {
            numCells += lifeform.numCells;
        }
        return numCells;
    }

    _trySpawnMold(spawnTime, forceSpawn) {
        let col = getNormallyDistributedRandomNumber(this.grid.width / 2, this.grid.width / 4.5);
        let row = getNormallyDistributedRandomNumber(this.grid.height / 2, this.grid.height / 4.5);
        col = Math.floor(Math.min(Math.max(0, col), this.grid.width - 1));
        row = Math.floor(Math.min(Math.max(0, row), this.grid.height - 1));
        if (!this.grid.inBounds(col, row)) {
            console.error("Could not spawn mold at ", col, row);
            return;
        }
        if (!forceSpawn && this.grid.getNutrition(col, row) < Math.random() * MOLD_NUTRITION_SPAWN_INF) {
            return;
        }
        const params = {
            col: col,
            row: row,
            spawnTime: spawnTime, 
            grid: this.grid,
            ecosystem: this,
            numGenes: Object.keys(MOLD_GENES).length,
        }
        const mold = new Mold(params);
        this._lifeforms.push(mold);
        this._molds.push(mold);
    }
}

class Simulation {
    constructor(initData) {
        this._initData = initData;
        this._settings = initData.settings;
        this._width = initData.settings.width;
        this._height = initData.settings.height;
        this._numTotalCells = this._width * this._height;
        this.reset();
    }

    start() {
        setInterval(this._loop.bind(this), LOOP_INVERVAL);
        this.addFood();
    }

    reset() {
        this._isFirstFrame = true;
        this._frame = 0;
        this._time = Date.now();
        this._startTime = this._time;
        this._lastTime = this._time;
        this._lastSendTime = this._time;
        this._sendInterval = SEND_MESSAGE_BASE_INTERVAL;
        this._grid = new Grid(this._initData);
        this._ecosystem = new Ecosystem(this._grid, this._time);
    }

    addFood() {
        this._grid.addFood();
    }

    spawnMold() {
        this._ecosystem.spawn(LIFEFORM_TYPES.Mold, this.time, true);
    }

    _loop() {
        this._time = Date.now();
        const deltaTime = this._time - this._lastTime;
        this._lastTime = this._time;
        for (let i = 0; i < NUM_TICKS_PER_FRAME; i++) {
            if (this._frame % SIM_FRAME_MOD == 0) {
                this._ecosystem.update(this._time, deltaTime);
                this._frame++;
            }
        }
        if (this._time - this._lastSendTime > this._sendInterval && this.sendResults != null) {
            this._lastSendTime = this._time;
            const intervalRatio = this._ecosystem.numLifeformCells / this._numTotalCells;
            this._sendInterval = SEND_MESSAGE_BASE_INTERVAL + SEND_INTERVAL_INCREASE * intervalRatio;
            this.sendResults(); 
        }
    }

    get _timeSinceStart() {
        return this._time - this._startTime;
    }
    
    popFrameData() {
        const frameData = [1000 / this._sendInterval, this._grid.getRenderResults()];
        this._isFirstFrame = false;
        return frameData;
    }
}