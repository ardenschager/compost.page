const LAYERS = {
	Default: "default",
	Ground: "ground",
	Plant: "plant",
};

class CellLayer {
    constructor(type, letter, color, bgColor) {
        if (type == 'default') {
            this.letter = '.';
            this.color = 'black';
            this.bgColor = 'white';
        } else {
            this.letter = letter;
            this.color = color;
            this.bgColor = bgColor;
        }
    }
}

class GridCell {
    constructor(grid, row, col, initData) {
        this.grid = grid;
        this.settings = grid.settings;
        this.idx = row * this.settings.width + col;
        const scrapeData = initData.scrapeData[this.idx];
        let defaultLayer = new CellLayer(LAYERS.Default);
        this.layers = {};
        this.layers[LAYERS.Default] = defaultLayer;
        if (scrapeData != null) {
            this.idx = row * this.settings.width + col;
            const letter = scrapeData.letter;
            const color = chroma.mix('black', 'red', scrapeData.analysis.sentiment * 0.5 + 0.5).hex();
            const bgColor = chroma.mix('white', 'gray', scrapeData.analysis.toxicity).hex();
            const groundLayer = new CellLayer(LAYERS.Ground, letter, color, bgColor);
            this.layers[LAYERS.Ground] = groundLayer;
        }
    }

    setLayerTo(type, result) {

    }

    getLayer(type) {
        return this.layers[type];
    }

    get topLayer() {
        if (this.layers[LAYERS.Plant] != null) {
            return this.layers[LAYERS.Plant];
        } else if (this.layers[LAYERS.Ground] != null) {
            return this.layers[LAYERS.Ground];
        } else {
            return this.layers[LAYERS.Default];
        }
    }

    get letter() {
        return this.topLayer.letter;
    }

    get color() {
        return this.topLayer.color;
    }

    get bgColor() {
        return this.topLayer.bgColor;
    }

    get result() {
        return {
            letter: this.letter,
            color: this.color,
            bgColor: this.bgColor,
        };
    }
}

class Grid {
    constructor(initData) {
        this.settings = initData.settings;
        this.width = initData.settings.width;
        this.height = initData.settings.height;
        this.rows = [];
        this.initCells(initData);
    }

    initCells(initData) {
        for (let r = 0; r < this.height; r++) {
            const row = [];
            this.rows.push(row);
            for (let c = 0; c < this.width; c++) {
                row.push(new GridCell(this, r, c, initData));
            }
        }
    }

    getCell(col, row) {
        return this.rows[row][col];
    }

    isCellLayerOccupied(col, row, type) {
        const cell = getCell(col, row);
        return cell.getLayer(type) != null;
    }

    setCell(col, row, type, result) {
        this.rows[row][col].setLayerTo(type, result);
    }

    get result() {
        const result = [];
        for (let r = 0; r < this.height; r++) {
            const row = [];
            this.rows.push(row);
            for (let c = 0; c < this.width; c++) {
                row.push(this.getCell(c, r).result);
            }
            result.push(row);
        }
        return result;
    }
}