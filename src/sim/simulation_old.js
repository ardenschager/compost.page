// an app that grows plant like structures using diffusion limited aggregation
// by nat schager

class CellLayers {
    constructor(row, col, letter=START_GRID_CHAR, word=START_GRID_CHAR) {
        this.cells = {
            compost: new Cell(row, col, letter, word),
            dead: null,
            plant: null,
            flower: null,
            bug: null,
        }
    }

    getTopCell() {
        if (this.cells.flower != null) {
            return this.cells.flower;
        } else if (this.cells.plant != null) {
            return this.cells.plant;
        } else {
            return this.cells.compost;
        }
    }
}

// A generic grid cell class
class Cell {
    constructor(row, col, letter=START_GRID_CHAR, word=START_GRID_CHAR) {
        this.lifetime = 0;
        this.row = row;
        this.col = col;
        this.letter = letter;
        this.word = word;
    }

    update() {
        this.lifetime++;
    }

    getLetter() {
        // this.letter.fontcolor("red");
        return this.letter;
    }

    getColor() {
        return GRAY;
    }

    getWeight() {
        return 'normal';
    }

    getBackgroudColor() {
        return BODY;
    }

    getColor() {
        return document.body.style.color;
    }

    getWeight() {
        return 'normal';
    }

    getBackgroudColor() {
        return document.body.style.backgroundColor;
    }
}

// A more specific plant cell
class PlantCell extends Cell {
    constructor(row, col, parent, plant) {
        super(row, col);
        this.parent = parent;
        this.plant = plant;
        this.inputStr = plant.string;
        if (this.parent != null) {
            this.index = (this.parent.index + 1) % this.inputStr.length;
        } else {
            this.index = 0;
        }
        this._setLetterFromIndex();
        this.letterSwitchTimer = 0;
        this.isAlive = true;
        this.lifeRat = 0;
    }

    _setLetterFromIndex() {
        try {
            this.letter = Array.from(this.inputStr)[this.index]; // this sometimes breaks
        } catch (e) {
            console.error("plant cell error error: " + e);
            console.log("str: ", this.inputStr, this.index);
            this.inputStr = "nat"
            this.letter = "n";
        }
    }

    update() {
        super.update();
        // die after a while? or change letter? 
        this.lifeRat = this.lifetime / LIFESPAN;
        if (this.lifetime >= LIFESPAN) {
            this.isAlive = false;
        }
    }

    // vary depending on factors, like age maybe
    getLetter() {
        if (this.letterSwitchTimer > LETTER_SWITCH_TIMEOUT) {
            this.letterSwitchTimer = 0;
            this.index = (this.index + 1) % this.inputStr.length;
            this._setLetterFromIndex();
        } else {
            this.letterSwitchTimer++;
        }
        return SYMBOL_MAP[this.letter];
    }

    getColor() {
        const offsetC0 = this.plant.genes.offsetC0;
        const offsetC1 = this.plant.genes.offsetC1;
        const offsetC2 = this.plant.genes.offsetC2;
        // console.log(offsetC0, offsetC1);
        let c0 = chroma({ 
            h: (240 + offsetC0) % 360, 
            s: 1,
            l: 0.5,
        });
        let c1 = chroma({ 
            h: 40 + offsetC1, 
            s: 0.9 - 0.8 * this.index / this.inputStr.length, 
            l: 0.5 - 0.5 * this.lifeRat,
        });
        let c2 = chroma({ 
            h: 60 + offsetC2, 
            s: 0.4 - 0.4 * this.index / this.inputStr.length, 
            l: 0.5 - 0.5 * this.lifeRat,
        });
        let f = chroma.scale([c0, c1, c2]);
        return f(this.lifeRat);
    }

    getWeight() {
        return 'bold';
    }

    getBackgroudColor() {
        let c0 = chroma({ 
            h: 70 + this.plant.genes.offsetBgHue,
            s: 0.225 + this.plant.genes.offsetBgSat - 0.15 * this.lifeRat,
            l: 0.8 - 0.3 * this.lifeRat,
        });
        return c0;
    }
}

class FlowerCell {
    constructor() {

    }
}

class DeadCell {
    constructor() {

    }
}

class BugCell {
    constructor() {

    }
}

class Genes {
    constructor(string) {
        const seed = cyrb128(string);
		const random = sfc32(seed[0], seed[1], seed[2], seed[3]);
        this.offsetC0 = random() * 180;
        this.offsetC1 = random() * 120;
        this.offsetC2 = random() * 120;
        this.offsetBgHue = random() * 85;
        this.offsetBgSat = random() * 0.225;
        this.outgrowth = random() * 0.2;
    }
}

// entity that grows using DLA and does other things
class Plant {
    constructor(row, col, grid, string) {
        this.lifetime = 0;
        this.row = row;
        this.col = col;
        this.grid = grid;
        if (string == null || !string.trim()) {
            string = "gattaca";
        }
        this.string = string;
        this.cellDict = {};
        this.cellList = [];
        this.spawnRoot(row, col);
        this.genes = new Genes(string);
        this.flowers = [];
    }

    cacheCell(row, col, cell) {
        if (this.cellDict[row] == null) {
            this.cellDict[row] = {};
        }
        this.cellDict[row][col] = cell;
        this.cellList.push(cell);
    }

    spawnRoot(row, col) {
        let root = new PlantCell(row, col, null, this); // this sometimes breaks
        this.cacheCell(row, col, root);
    }

    trySpawnCell(row, col, parent) {
        let cell = new PlantCell(row, col, parent, this);
        let success = this.grid.tryCreateNewPlantCell(row, col, cell);        
        if (success) {
            this.cacheCell(row, col, cell);
            return cell;
        } else {
            return null;
        }
    }

    returnCellHit(row, col, randomizeDirections = true) {
        let candidates = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                let r = row + i;
                let c = col + j;
                if (i == 0 && j == 0 || r < 0 || c < 0 || r >= this.grid.numRows || c >= this.grid.numCols) continue;
                candidates.push({r: r, c: c});
            }
        }
        if (randomizeDirections) {
            shuffleArray(candidates); // randomize directions to not get a directional bias. 
        }
        for (let candidate of candidates) { // look through candidates and see if one of them hits
            let r = candidate.r;
            let c = candidate.c;
            let cell = this.tryGetCell(r, c);
            if (cell != null) {
                return cell;
            }
        }
        return null;
    }

    get numCells() {
        return this.cellList.length;
    }

    // grow using diffusion limited aggregation
    grow() {
        // pick random place in grid
        let newCell = null;
        let cnt = 0;
        let row = 0;
        let col = 0;
        // start somewhere random not in the plant already
        const numTries = Math.max(MIN_TRIES, DLA_TRIES - this.numCells);
        while (true) {

            if (cnt >= numTries) {
                return; // just return if dla times out
            }

            let _row = Math.random() * this.grid.numRows;
            let _col = Math.random() * this.grid.numCols;
            // _row = lerp(this.row, _row, 0.7 + this.genes.outgrowth); // control how far plant will grow from base
            // _col = lerp(this.col, _col, 0.7 + this.genes.outgrowth);
            _row = Math.floor(_row);
            _col = Math.floor(_col);
            
            let cell = this.tryGetCell(_row, _col);

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
                this.nextMoveAway = null
            }

            row += xMove;
            col += yMove;

            if (row < 0 || 
                row > this.grid.numRows || 
                col < 0 || 
                col > this.grid.numCols) {
                continue;
            }

            if (TRAVERSE_SPACE_CHANCE < Math.random() && 
                this.grid.getCharAt(row, col) == " ") {
                continue;
            }
            
            let hitCell = this.returnCellHit(row, col);
            
            // if there is a hit, hit cell becomes parent of new cell
            if (hitCell != null) {
                let prevRow = row;
                let prevCol = col;
                row = Math.max(0, Math.min(row, this.grid.numRows - 1));
                col = Math.max(0, Math.min(col, this.grid.numCols - 1));
                newCell = this.trySpawnCell(row, col, hitCell);
                if (newCell != null) {
                    break;
                } else {
                    row = prevRow;
                    col = prevCol;
                }
            }
        }
    }

    update() {
        let newList = [];
        for (const cell of this.cellList) {
            cell.update();
            if (cell.isAlive) {
                newList.push(cell);
            } else {
                // this.grid.setCell(cell.row, cell.col, new Cell(cell.row, cell.col)); // error on death
            }
        }
        this.cellList = newList;
        this.grow();
        this.lifetime++;
    }

    tryGetCell(row, col) {
        if (this.cellDict.hasOwnProperty(row) && this.cellDict[row].hasOwnProperty(col)) {
            return this.cellDict[row][col];
        } else {
            return null;
        }
    }
}

class WordHelper {
    constructor(compostString) {
        this.compostString = compostString;
        // this.compostString = this.compostString.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toUpperCase();
        this.words = this.compostString.split(/(\s+)/);
        this._calculateFontMetrics();
        this._populateWordIndex();
    }

    getCharAt(idx) {
        return this.compostString.charAt(idx);
    }

    getWordAt(idx) {
        return this.wordIndex[idx];
    }

    get length() {
        return this.compostString.length;
    }

    sanitize(word) {
        word = word.replace(/\s/g, '');
        word = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        return word;
    }

    _calculateFontMetrics() {
        // font constants
        const font = getCanvasFont(document.body);
        const metrics = getFontMetrics("X", font);
        this.charWidth = (metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight) / OVERSCALE / 1.31;
        this.charHeight = (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) / OVERSCALE;
    }

    _populateWordIndex() {
        this.wordIndex = {};
        let total = 0;
        for (let word of this.words) {

            for (let i = total; i < total + word.length; i++) {
                this.wordIndex[i] = word;
                let letter = this.compostString.charAt(i);
                // console.log(i, letter, word);
            }
            total += word.length;
        }
    }
}

// holds the letters, to be drawn
class Grid {
    constructor(compostString) {
        this.wordHelper = new WordHelper(compostString);
        this.calculateGridSize();
        this.reset();
    }

    reset() {
        this.numCols = Math.floor(window.innerWidth / this.wordHelper.charWidth) - 1;
        this.numRows = Math.floor(window.innerHeight / this.wordHelper.charHeight) - 1;
        this.plants = [];
        this.cellRows = [];
        for (let i = 0; i < this.numRows; i++) {
            let row = new Array();
            this.cellRows.push(row);
            for (let j = 0; j < this.numCols; j++) {
                let idx = (i * this.numCols + j) % this.wordHelper.length;
                let word = this.wordHelper.getWordAt(idx);
                let letter = this.wordHelper.getCharAt(idx);
                let cnt = 0;
                do {
                    idx = (i * this.numCols + j + cnt) % this.wordHelper.length;
                    word = this.wordHelper.getWordAt(idx);
                    // letter = this.wordHelper.getCharAt(idx);
                    cnt++;
                } while(!containsAnyLetters(word)) // https://bobbyhadz.com/blog/javascript-check-if-string-contains-any-letter
                word = this.wordHelper.sanitize(word);
                row.push(new Cell(i, j, letter, word));
            }
        }
        this.initHtml();
    }

    initHtml() {
        this.textNodes = [];
        this.textSpans = [];
        for (let i = 0; i < this.numRows; i++) {
            for (let j = 0; j < this.numCols; j++) {               
                const node = document.createElement("span");
                let arr = new Array(this.numCols);
                const textNode = document.createTextNode(arr.join(""));
                node.appendChild(textNode);
                document.body.appendChild(node);
                this.textSpans.push(node);
                this.textNodes.push(textNode);
            }
            let linebreak = document.createElement("br");
            document.body.appendChild(linebreak);
        }
    }

    getWordAt(row, col) {
        const idx = (row * this.numCols + col) % this.wordHelper.length;
        return this.wordHelper.getWordAt(idx);
    }

    getCharAt(row, col) {
        const idx = (row * this.numCols + col) % this.wordHelper.length;
        return this.wordHelper.getCharAt(idx);
    }

    calculateGridSize() {
         
    }

    getCell(row, col) {
        return this.cellRows[row][col];
    }

    // todo: check collision with other plants
    tryCreateNewPlantCell(row, col, value) {
        let cell = this.cellRows[row][col];
        if (cell instanceof PlantCell) {
            return false;
        }
        this.cellRows[row][col] = value;
        return true;
    }

    setCell(row, col, value) {
        this.cellRows[row][col] = value;
    }

    draw() {
        for (let i = 0; i < this.numRows; i++) {
            for (let j = 0; j < this.numCols; j++) {
                let cell = this.getCell(i, j);
                let idx = i * this.numCols + j;
                this.textNodes[idx].nodeValue = cell.getLetter();
                this.textSpans[idx].style.color = cell.getColor();
                this.textSpans[idx].style.fontWeight = cell.getWeight();
                this.textSpans[idx].style.backgroundColor = cell.getBackgroudColor();
            }
        }
    }
}

// responsible for spawning plants, updating plants, and drawing the grid
class Simulation {
    constructor() {

    }

    init(compostString=compostString) {
        this.lifetime = 0;
        this.grid = new Grid(compostString);
        // this.centerScroll();
        this.plants = [];
        for (let i = 0; i < NUM_STARTING_PLANTS; i++) {
            this.spawnPlant();
        }
        this.requestFrame();
    }

    // calles update loop from window
    requestFrame() {
        window.requestAnimationFrame(this.update.bind(this));
    }

    spawnPlant() {
        let row = Math.floor(getNormallyDistributedRandomNumber(this.grid.numRows / 2, this.grid.numRows / 3));
        let col = Math.floor(getNormallyDistributedRandomNumber(this.grid.numCols / 2, this.grid.numCols / 3));
        let str = this.grid.getWordAt(row, col);
        this.plants.push(new Plant(row, col, this.grid, str));
    }

    // https://stackoverflow.com/questions/19111304/javascript-scroll-to-center-or-scroll-to-body
    // https://stackoverflow.com/questions/1174863/javascript-scrollto-method-does-nothing
    centerScroll() {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual'
        }
        setTimeout(function () {
            document.body.scrollIntoView({
                behavior: "auto",
                block: "center",
                inline: "center",
            });
            window.scrollTo( screen.width/2, screen.height/2 );
        },0.1);
    }


    update() {
        for (let i = 0; i < NUM_TICKS_PER_FRAME; i++) {
            if (this.lifetime % SIM_FRAME_MOD == 0) {
                for (const plant of this.plants) {
                    plant.update();
                }
                this.lifetime++;
            }
            this.grid.draw();
        }
        // trigger request for next frame
        this.requestFrame();
    }
}

