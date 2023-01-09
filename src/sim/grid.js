// holds the cell data for various layers we are rendering to
class GridLayer {
    constructor(cell, type) {
        this.cell = cell;
        this.row = cell.row;
        this.col = cell.col;
        this.type = type;
    }

    get letter() {
        return this.cell.letter;
    }

    get fontColor() {
        return this.cell.fontColor;
    }

    get bgColor() {
        return this.cell.bgColor;
    }

    get markColor() {
        return this.cell.markColor;
    }
}

// interfaces with the grid to render result. gets topmost layer and returns it
class GridCell {
    constructor(col, row, grid) {
        this.grid = grid;
        this.settings = grid.settings;
        this.col = col;
        this.row = row;
        this.idx = row * this.settings.width + col;
        this.layers = {};
    }

    setLayerTo(type, cell) {
        if (this.layers[type] == null) {
            this.layers[type] = new GridLayer(cell, type);
        } else {
            this.layers[type].cell = cell;
        }
    }

    isLayerOccupied(type) {
        return this.getLayer(type) != null;
    }

    getLayer(type) {
        return this.layers[type];
    }

    removeLayer(type) {
        this.layers[type] = null;
    }

    getNextCellUnder(type) {
        if (type == LAYER_TYPES.Detritus) {
            if (this.layers[LAYER_TYPES.Mold] != null) {
                return this.layers[LAYER_TYPES.Mold].cell;
            } else {
                return this.layers[LAYER_TYPES.Soil].cell;
            }
        } else if (type == LAYER_TYPES.Mold) {
            return this.layers[LAYER_TYPES.Soil].cell; // there should always be soil
        }
    }

    // Return layer by render order
    get topLayer() {
        if (this.layers[LAYER_TYPES.Detritus] != null) {
            return this.layers[LAYER_TYPES.Detritus];
        } else if (this.layers[LAYER_TYPES.Mold] != null) {
            return this.layers[LAYER_TYPES.Mold];
        } else if (this.layers[LAYER_TYPES.Soil] != null) {
            return this.layers[LAYER_TYPES.Soil];
        } else {
            return this.layers[LAYER_TYPES.Default]; // should not reach here
        }
    }

    get letter() {
        return this.topLayer.letter;
    }

    get fontColor() {
        return this.topLayer.fontColor;
    }

    get markColor() {
        return this.topLayer.markColor;
    }

    get bgColor() {
        return this.topLayer.bgColor;
    }

    get result() {
        return {
            letter: this.letter,
            fontColor: this.fontColor,
            markColor: this.markColor,
            bgColor: this.bgColor,
        };
    }
}

// interafces with simulation, sets layers, returns result. Does a lot, maybe too much
class Grid {
    constructor(initData) {
        this.settings = initData.settings;
        this.width = initData.settings.width;
        this.height = initData.settings.height;
        this._changedCells = new Set();
        this.initCells(initData);
    }

    // Init soil layer using scrape data
    initCells(initData) {
        noise.seed(Math.random()); // for perlin noise in soil cells
        this._gridCells = [];
        this._soilCells = [];
        for (let r = 0; r < this.height; r++) {
            const gridRow = [];
            const soilRow = [];
            this._gridCells.push(gridRow);
            this._soilCells.push(soilRow);
            for (let c = 0; c < this.width; c++) {
                const soilCell = new SoilCell(c, r, this, initData);
                soilRow.push(soilCell);
                gridRow.push(new GridCell(c, r, this));
                this.setLayerTo(c, r, LAYER_TYPES.Soil, soilCell);
            }
        }
    }

    _foodNoise(c, r) {
        return noise.simplex2(c / 35, r / 35) + 0.5 * noise.simplex2(c / 12, r / 12) + noise.simplex2(c / 5, r / 5) * 0.25;
    }

    addFood() {
        noise.seed(Math.random()); // for perlin noise again
        let word = "yum"; 
        for (let r = 0; r < this.height; r++) {
            let wordCol = 0;
            let inNoise = false;
            for (let c = 0; c < this.width; c++) {
                const nutrition = this._foodNoise(c, r);
                const soilCell = this.getSoilCell(c, r);
                if (nutrition > FOOD_NUTRITION_CUTOFF && soilCell) {
                    let letter = ".";
                    if (!inNoise) {
                        inNoise = true;
                        wordCol = c;
                        let wordLen = 1;
                        while(true) { // get word that fits in noise
                            if (c + wordLen >= this.width) break;
                            const _nutrition = this._foodNoise(c + wordLen, r);
                            if (_nutrition < FOOD_NUTRITION_CUTOFF) break; // crawl to edge of noise
                            wordLen++;
                        }
                        word = getRandomWord({exactly: 1, minLength: wordLen, maxLength: wordLen})[0];
                        letter = word[0];
                    } else {
                        const idx = c - wordCol;
                        letter = word[idx];
                    }
                    const _nutrition = nutrition * FOOD_NUTRITION_SCALE - FOOD_NUTRITION_CUTOFF;
                    const foodCell = new FoodCell(c, r, this, letter, word, _nutrition);
                    this.setLayerTo(c, r, LAYER_TYPES.Detritus, foodCell);
                } else {
                    inNoise = false;
                }
            }
        }
    }

    getGridCell(col, row) {
        return this._gridCells[row][col];
    }

    getSoilCell(col, row) {
        return this._soilCells[row][col];
    }

    getCellFromLayer(col, row, type) {
        const layer = this.getGridCell(col, row).getLayer(type);
        if (layer != null) {
            return layer.cell;
        } else {
            return null;
        }
    }

    getNextCellUnder(col, row, type) {
        return this.getGridCell(col, row).getNextCellUnder(type);
    }

    getNutrition(col, row) {
        let nutrition = this.getSoilCell(col, row).nutrition;
        const detritusCell = this.getCellFromLayer(col, row, LAYER_TYPES.Detritus);
        if (detritusCell != null) {
            nutrition += detritusCell.nutrition;
        }
        return nutrition;
    }

    isCellLayerOccupied(col, row, type=LAYER_TYPES.Default) {
        const cell = this.getGridCell(col, row);
        return cell.isLayerOccupied(type);
    }

    setLayerTo(col, row, type, cell) {
        this._gridCells[row][col].setLayerTo(type, cell);
        this.setAsChanged(col, row);
    }

    removeLayer(col, row, type) {
        this._gridCells[row][col].removeLayer(type);
        this.setAsChanged(col, row);
    }

    inBounds(col, row) {
        return this._gridCells?.[row] != null && this._gridCells[row]?.[col] != null;
    }

    setAsChanged(col, row) {
        const coordJson = JSON.stringify({col: col, row: row});
        this._changedCells.add(coordJson);
    }

    // writes changed grid cells to a list and returns them
    getRenderResults() {
        const results = [];
        for (let coordJson of this._changedCells.values()) {
            const coords = JSON.parse(coordJson);
            const row = coords.row;
            const col = coords.col;
            const result = this.getGridCell(col, row).result;
            results.push({coords: coords, result: result });
        }
        this._changedCells.clear();
        return results;
    }
}