class MoldCell {

}

class Mold {
    constructor(row, col, grid) {
        this.lifetime = 0;
        this.row = row;
        this.col = col;
        this.grid = grid;
        this.cells = [];
    }

    update() {

    }

    get numCells() {
        return this.cells.length;
    }

    getCell(col, row) {
        if (this.cells[row] != null) {
            if (this.cells[row][col] != null) {
                return this.cells[row][col];
            }
        } 
        return null;
    }

    tryGetCell(col, row) {
        if (this.cells?.[row] != null && this.cells[row]?.[col] != null) {
            return this.cells[row][col];
        } else {
            return null;
        }
    }

    trySpawnCell(col, row, parent) {
        let isOccupied = this.grid.isCellLayerOccupied(row, col, LIFEFORM_TYPES.Mold);        
        if (!isOccupied) {
            const cell = new MoldCell(col, row, parent);
            this.cacheCell(row, col, cell);
            return cell;
        } else {
            return null;
        }
    }

    grow() {
        // pick random place in grid
        let newCell = null;
        let cnt = 0;
        let row = 0;
        let col = 0;
        // start somewhere random not in the Mold already
        const numTries = Math.max(MIN_TRIES, DLA_TRIES - this.numCells);
        while (true) {

            if (cnt >= numTries) {
                return; // just return if dla times out
            }

            let _row = Math.random() * this.grid.height;
            let _col = Math.random() * this.grid.width;
            // _row = lerp(this.row, _row, 0.7 + this.genes.outgrowth); // control how far Mold will grow from base
            // _col = lerp(this.col, _col, 0.7 + this.genes.outgrowth);
            _row = Math.floor(_row);
            _col = Math.floor(_col);
            
            let cell = this.tryGetCell(_col, _row);

            if (cell == null) { // unoccupied, which means we can start the crawl
                row = _row;
                col = _col;
                break;
            }
            cnt++;
        }
        // random walk until you collide with existing structure, then spawn a new cell
        while (true) {
            cnt++;

            if (cnt >= DLA_TRIES) {
                return; // just return if DLA times out
            }

            // move particle randomly
            let xMove = MOVESET[Math.floor(Math.random() * MOVESET.length)];
            let yMove = MOVESET[Math.floor(Math.random() * MOVESET.length)];
            if (this.nextMoveAway != null) {
                xMove = this.nextMoveAway.x;
                yMove = this.nextMoveAway.y;
                this.nextMoveAway = null;
            }

            row += xMove;
            col += yMove;

            if (row < 0 || 
                row > this.grid.height || 
                col < 0 || 
                col > this.grid.width) {
                continue;
            }

            if (TRAVERSE_SPACE_CHANCE < Math.random() && 
                this.grid.getCell(col, row).letter == " ") {
                continue;
            }
            
            let hitCell = this.returnCellHit(row, col);
            
            // if there is a hit, hit cell becomes parent of new cell
            if (hitCell != null) {
                let prevRow = row;
                let prevCol = col;
                row = Math.max(0, Math.min(row, this.grid.height - 1));
                col = Math.max(0, Math.min(col, this.grid.width - 1));
                newCell = this.trySpawnCell(col, row, hitCell);
                if (newCell != null) {
                    break;
                } else {
                    row = prevRow;
                    col = prevCol;
                }
            }
        }
    }

    returnCellhit(col, row, randomizeDirections=true) {

    returnCellHit(row, col, randomizeDirections = true) {
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
            let cell = this.tryGetCell(c, r);
            if (cell != null) {
                return cell;
            }
        }
        return null;
    }
    }
}