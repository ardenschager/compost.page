class Lifeform {
    constructor(params) {
        this.grid = params.grid;
        this.spawnTime = params.spawnTime;
        if (params.genes == null) {
            if (params.numGenes != null) 
                this.genes = new Genes({numGenes: params.numGenes});
        } else {
            this.genes = params.genes;
        }
        this._ecosystem = params.ecosystem;
        this._lifetime = 0;
        this._row = params.row;
        this._col = params.col;
        this._cellDict = {};
        this._cellList = [];
        this._lifeformType = LIFEFORM_TYPES.Default;
        this._layerType = LAYER_TYPES.Default;
    }

    update(deltaTime) {
        this._updateCells(deltaTime);
        if (this._cellList.length == 0) {
            this.ecosystem.remove(this); // dead
        } else {
            this._lifetime += deltaTime;
        }
    }

    get numCells() {
        return this._cellList.length;
    }

    get type() {
        return this._lifeformType;
    }

    get layer() {
        return this._layerType;
    }

    _updateCells(deltaTime) {
        for (let cell of this._cellList) {
            cell.update(deltaTime);
        }
        this._cellList.filter((cell) => { 
            if (!cell.isAlive) { // bad but whatever
                delete this._cellDict[cell.row][cell.col];
            }
            return cell.isAlive;
        });
    }

    _cacheCell(col, row, cell) {
        if (this._cellDict[row] == null) {
            this._cellDict[row] = {};
        }
        this._cellDict[row][col] = cell;
        this._cellList.push(cell);
    }
}

// class MoldSpore extends Lifeform {
//     constructor(params) {
//         super(params);
//         this.pos = {
//             x: params.col,
//             y: params.row,
//         }
//         // this._layerType = LAYER_TYPES.Spores;
//         // this._lifeformType = LIFEFORM_TYPES.MoldSpore;
//     }
// }

class Mold extends Lifeform {
    constructor(params) {
        super(params);
        this._layerType = LAYER_TYPES.Mold;
        this._lifeformType = LIFEFORM_TYPES.Mold;
        this._spawnMoldCell(this._col, this._row, this.spawnTime);
        // console.log('mold spawned', params.col, params.row);
    }

    update(deltaTime) {
        if (this._lifetime < MOLD_BASE_LIFESPAN) {
            this._dla();
        } else {
            this._die();
        }
        super.update(deltaTime);
    }

    _die() {
        for (let cell of this._cellList) {
            cell.health -= MOLD_CELL_DEGRADE_RATE;
        }
    }

    _spawnMoldCell(col, row, spawnTime, parentCell=null) {
        const cell = new MoldCell(col, row, spawnTime, this, parentCell);
        this.grid.setLayerTo(col, row, LAYER_TYPES.Mold, cell);
        this._cacheCell(col, row, cell);
        return cell;
    }

    _trySpawnMoldCell(col, row, parentCell) {
        let isOccupied = this.grid.isCellLayerOccupied(col, row, this._layerType);
        if (!isOccupied && this.grid.getNutrition(col, row) > Math.random() * MOLD_NUTRITION_GROWTH_INF) {
            const cellSpawnTime = this.spawnTime + this._lifetime;
            const cell = this._spawnMoldCell(col, row, cellSpawnTime, parentCell);
            return cell;
        } else {
            return null;
        }
    }

    _tryGetOwnCell(col, row) {
        if (this._cellDict[row] != null && this._cellDict[row][col] != null) {
            return this._cellDict[row][col];
        } else {
            return null;
        }
    }

    _tryGetEmptyGridCell(col, row) {
        if (this._tryGetOwnCell(col, row) == null && 
            this.grid.isCellLayerOccupied(col, row, this.layer)) {
            return this.grid.getGridCell(col, row);
        } else {
            return null
        }
    }

    // Diffusion Limited Aggregation growth algorithm
    _dla() {
        // pick random place in grid
        let newCell = null;
        let cnt = 0;
        let row = 0;
        let col = 0;
        // start somewhere random not in the Mold already
        const numTries = Math.max(MOLD_MIN_DLA_TRIES, MOLD_DLA_TRIES - this.numCells);
        while (true) {

            if (cnt >= numTries) {
                return; // just return if dla times out
            }

            let _row = Math.random() * this.grid.height;
            let _col = Math.random() * this.grid.width;
            _row = Math.floor(_row);
            _col = Math.floor(_col);
            
            let cell = this._tryGetEmptyGridCell(_col, _row);

            if (cell == null) { // unoccupied, which means we can start the crawl
                row = _row;
                col = _col;
                break;
            }
            cnt++;
        }
        // random walk until it collides with existing structure, then spawn a new cell
        while (true) {
            cnt++;

            if (cnt >= MOLD_DLA_TRIES) {
                return; // just exit if DLA times out
            }

            // move particle randomly
            let xMove = MOLD_DLA_MOVESET[Math.floor(Math.random() * MOLD_DLA_MOVESET.length)];
            let yMove = MOLD_DLA_MOVESET[Math.floor(Math.random() * MOLD_DLA_MOVESET.length)];
            
            // if (this.nextMoveAway != null) { // not used atm
            //     xMove = this.nextMoveAway.x;
            //     yMove = this.nextMoveAway.y;
            //     this.nextMoveAway = null;
            // }

            row += xMove;
            col += yMove;

            if (row < 0 || 
                row >= this.grid.height || 
                col < 0 || 
                col >= this.grid.width) {
                continue;
            }

            // Spaces are harder to traverse
            if (MOLD_TRAVERSE_SPACE_INF < Math.random() && 
                this.grid.getGridCell(col, row).letter == " " ) {
                continue;
            }
            
            let hitCell = this._returnCellHit(col, row);
            
            // if there is a hit, hit cell becomes parent of new cell
            if (hitCell != null) {
                let prevRow = row;
                let prevCol = col;
                row = Math.max(0, Math.min(row, this.grid.height - 1));
                col = Math.max(0, Math.min(col, this.grid.width - 1));
                newCell = this._trySpawnMoldCell(col, row, hitCell);
                if (newCell != null) {
                    break;
                } else {
                    row = prevRow;
                    col = prevCol;
                }
            }
        }
    }

    // Return a cell if collision occurs in one of the directions
    _returnCellHit(col, row, randomizeDirections = true) {
        let candidates = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                let r = row + i;
                let c = col + j;
                if (i == 0 && j == 0 || r < 0 || c < 0 || r >= this.grid.height || c >= this.grid.width) continue;
                candidates.push({r: r, c: c});
            }
        }
        if (randomizeDirections) {
            shuffleArray(candidates); // randomize directions to not get a directional bias. 
        }

        for (let candidate of candidates) { // look through candidates and see if one of them hits
            let r = candidate.r;
            let c = candidate.c;
            let cell = this._tryGetOwnCell(c, r);
            if (cell != null) {
                return cell;
            }
        }
        return null;
    }
}