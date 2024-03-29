// base behavior class for non GridCell cells
class Cell {
    constructor(col, row, grid) {
        this.grid = grid;
        this.row = row;
        this.col = col;
        this.idx = row * grid.width + col;
        this._nutrition = 1;
    }

    get result() {
        return {
            letter: this.letter,
            fontColor: this.fontColor,
            bgColor: this.bgColor,
            markColor: this.markColor,
        };
    }

    get layerType() {
        return LAYER_TYPES.Default;
    }

    get nutrition() {
        return this._nutrition;
    }

    set nutrition(value) {
        if (value < 0) {
            this._nutrition = 0;
        } else {
            this._nutrition = value;
        }
    }

    getConsumed(amount) { // anything can be eaten :) 
        this.setToRender();
        // if (this.layerType == LAYER_TYPES.Detritus) console.log(this.nutrition);
        let resultNutrition = this.nutrition - amount;
        this.nutrition = resultNutrition;
        if (resultNutrition <= 0) {
            return 0;
        } else {
            return amount;
        }
    }

    setToRender() {
        this.grid.setAsChanged(this.col, this.row);
    }
}

// Soil cell colors
const sentimentScale = chroma.scale(['#77331e', '#9b7969', '#cabc8d', '#dbe174']);
const identityAttackScale = chroma.scale(['#a9cfc4', '#99ba2d']);
const insultScale = chroma.scale(['#d4cfb4', '#c77456', '#bd2b2b']);
const obsceneScale = chroma.scale(['#c6ccad', '#7c874c','#146b62']);
const severeTocitityScale = chroma.scale(['#b8d9b4', '#6d946a', '#22571d', '#05350f']);
const sexualExplicitScale = chroma.scale(['#e8d3e1', '#cf1791', '#995d9d', '#4b0d6f',]);
const threatScale = chroma.scale(['#adc4b6', '#803259', '#bf0b20']);
const toxicityScale = chroma.scale(['#b8d9b4', '#b0d38f', '#167325']);
const markScale = chroma.scale(['#dfbbab', '#e6c9ba', '#93bdb7']);
const baseColor = chroma('#f5f5f5');
const spaceColor = chroma('#ffffff');

// Ingests scrape data and determines the results for the base substrate
class SoilCell extends Cell {
    constructor(col, row, grid, initData) {
        super(col, row, grid);
        this._initFromData(initData.scrapeData);
    }

    get layerType() {
        return LAYER_TYPES.Soil;
    }

    _initFromData(scrapeData) {
        let scrapeDatum = scrapeData[this.idx];
        if (scrapeDatum == null || scrapeDatum.letter == null) {
            this._letter = randomCharString(1);
            this.word = this._letter + randomCharString(4);
            this.wordIndex = 0;
            this.sentiment = 2 * Math.random() * Math.random() - 0.5;
            this._identityAttackScore = 0.5 * Math.random() * Math.random();
            this._insultScore = 0.5 * Math.random() * Math.random();
            this._obsceneScore = 0.5 * Math.random() * Math.random();
            this._severeToxicityScore = 0.5 * Math.random() * Math.random();
            this._sexualExplicitScore = 0.5 * Math.random() * Math.random();
            this._threatScore = 0.5 * Math.random() * Math.random();
            this._toxicityScore = 0.5 * Math.random() * Math.random();
        } else {
            this._letter = scrapeDatum.letter;
            this.word = scrapeDatum.word;
            // this.sentence = scrapeDatum.sentence;
            this.wordIndex = scrapeDatum.wordIndex;
            const analysis = scrapeDatum.analysis;
            this.sentiment = analysis.sentiment;
            this._identityAttackScore = analysis.identityAttack;
            this._insultScore = analysis.insult;
            this._obsceneScore = analysis.obscene;
            this._severeToxicityScore = analysis.severeToxicity;
            this._sexualExplicitScore = analysis.sexualExplicit;
            this._threatScore = analysis.threat;
            this._toxicityScore = analysis.toxicity;
        }

        this._calculateNutrition();
        this._calculateColorsFromScores();
    }

    _calculateNutrition() {
        const tfScore = (this._identityAttackScore + 
                        this._insultScore + 
                        this._obsceneScore + 
                        (this.sentiment * 0.5 + 0.5) +  
                        this._severeToxicityScore + 
                        this._sexualExplicitScore + 
                        this._threatScore + 
                        this._toxicityScore);
        const noiseResult = noise.simplex2(this.col / 6, this.row / 6);
        let baseNutrition = SOIL_BASE_NUTRITION * Math.max(0, SOIL_NOISE_NUTRITION_INF * noiseResult + 1);
        this.nutrition = tfScore + baseNutrition; // move this
        const sentimentWeightNormalized = Math.max(0, Math.min(1, (1 - this.sentiment)));
        this.nutrition = Math.max(SOIL_MIN_NUTRITION, this.nutrition);
        this.nutrition = sentimentWeightNormalized > SOIL_SENTIMENT_FERTILITY_CUTOFF ? 0 : this.nutrition; // don't eat happy words
        this.nutrition = this.letter == ' ' ? Math.max(0, baseNutrition) : this.nutrition;
    }

    get _clampedNutrition() {
        return Math.min(Math.max(this.nutrition, 0), 1);
    }

    // magic number party. just like shaders... 
    // todo: clean up
    _calculateColorsFromScores() {
        // bg color
        const sentimentWeight = Math.max(-1, Math.min(1, 1 - (this.sentiment - 0.5) * 2));
        const sentimentWeightNormalized = Math.max(0, Math.min(1, (1 - this.sentiment)));
        const insultColor = insultScale(Math.pow(this._insultScore, 0.5));
        const identityAttackColor = identityAttackScale(Math.pow(this._identityAttackScore, 0.5));
        const obsceneColor = obsceneScale(Math.pow(this._obsceneScore, 0.5));
        const severeToxicityColor = severeTocitityScale(Math.pow(this._severeToxicityScore, 0.5));
        const sexualExplicitColor = sexualExplicitScale(Math.pow(this._sexualExplicitScore, 0.5));
        const threatColor = threatScale(Math.pow(this._threatScore, 0.5));
        const toxicityColor = toxicityScale(Math.pow(this._toxicityScore, 0.5));
        let bgChroma = chroma.mix(baseColor, insultColor, Math.pow(this._insultScore, 0.5));
        bgChroma = chroma.mix(bgChroma, identityAttackColor, Math.pow(this._identityAttackScore, 0.5));
        bgChroma = chroma.mix(bgChroma, obsceneColor, Math.pow(this._obsceneScore, 0.5));
        bgChroma = chroma.mix(bgChroma, threatColor, Math.pow(this._threatScore, 0.5));
        bgChroma = chroma.mix(bgChroma, toxicityColor, Math.pow(this._toxicityScore, 0.5));
        bgChroma = chroma.mix(bgChroma, severeToxicityColor, Math.pow(this._severeToxicityScore, 0.5));
        bgChroma = chroma.mix(bgChroma, sexualExplicitColor, Math.pow(this._sexualExplicitScore, 0.5));
        const sentimentWeightShifted = Math.max(0, sentimentWeightNormalized - 0.5);
        bgChroma = chroma.mix(bgChroma, sentimentScale(sentimentWeightNormalized), sentimentWeightShifted);
        bgChroma.brighten(this._clampedNutrition * 0.5 - sentimentWeight);
        bgChroma = chroma.mix(bgChroma, spaceColor, 0.5 * (this.letter == ' ' ? 1 : 0));
        bgChroma.desaturate(0.3 * bgChroma.hsv()[1]);
        // Mark color
        const noiseResult = noise.simplex2(this.col / 5, this.row / 5);
        let markChroma = markScale(noiseResult);
        const mixAmount = Math.max(0, 0.25 + 0.25 * this._clampedNutrition - sentimentWeightNormalized);
        markChroma = chroma.mix(bgChroma.saturate(0.3).darken(0.1), markChroma.darken(0.2).saturate(0.2), mixAmount);
        // markChroma.desaturate(0.3);
        // FOnt color
        let fontChroma = sentimentScale(sentimentWeightNormalized).darken(0.5);
        const shiftHsv = markChroma.hsv();
        shiftHsv[0] = shiftHsv[0] + 0.15;
        shiftHsv[1] = shiftHsv[1] + 0.25;
        shiftHsv[2] = Math.pow(1 - shiftHsv[2], 2);
        const shiftedChroma = chroma(shiftHsv);
        fontChroma = chroma.mix(fontChroma, shiftedChroma, 0.75);
        fontChroma = fontChroma.luminance(1.0 - Math.pow(markChroma.luminance(), this._clampedNutrition)).desaturate(1.5 - markChroma.hsv()[1]);
        fontChroma.darken(10 * Math.pow((0.5 - Math.abs(0.5 - fontChroma.luminance())), 2));
        // fontChroma = chroma.mix(fontChroma.luminance(1 - markChroma.hsv()[1]), fontChroma, 0.4);
        this.fontChroma = fontChroma;
        this.markChroma = markChroma;
        this.bgChroma = bgChroma;
    }

    get letter() {
        return this._letter.charCodeAt(0);
    }

    get fontColor() {
        return this.fontChroma.hex();
    }

    get markColor() {
        return this.markChroma.hex();
    }

    get bgColor() {
        return this.bgChroma.hex();
    }
}

const detritusScale = chroma.scale(['#858585', '#86887c', '#a1bd93', '#acc47e', '#aadc98']);

class DetritusCell extends Cell {
    constructor(col, row, grid, letter, nutrition) {
        super(col, row, grid);
        this.nutrition = nutrition;
        if (letter == null || letter.length == 0) {
            letter = randomCharString(1);
        }
        this._letter = letter;
    }

    getConsumed(amount) {
        const result = super.getConsumed(amount);
        if (this.nutrition <= 0) {
            this.grid.removeLayer(this.col, this.row, this.layerType);
        }
        return result;
    }

    get normalizedNutrition() {
        return this.nutrition / (1 - FOOD_NUTRITION_CUTOFF)
    }

    get layerType() {
        return LAYER_TYPES.Detritus;
    }

    get _clampedNutrition() {
        return Math.min(1, Math.max(0, this.nutrition));
    }

    get _detritusChroma() {
        return detritusScale(this._clampedNutrition);
    }

    get _cellUnder() {
        return this.grid.getNextCellUnder(this.col, this.row, this.layerType);
    }

    get _fontChroma() {
        const fontChroma = this._detritusChroma.darken(1.5).saturate(0.5);
        return chroma.mix(chroma(this._cellUnder.fontColor), fontChroma, this._clampedNutrition);
    }

    get _markChroma() {
        return chroma.mix(chroma(this._cellUnder.markColor), this._detritusChroma, this._clampedNutrition);
    }

    get _bgChroma() {
        const bgChroma = this._detritusChroma.desaturate(0.5).brighten(0.5);
        return chroma.mix(chroma(this._cellUnder.bgColor), bgChroma, this._clampedNutrition);
    }

    get letter() {
        return this._letter.charCodeAt(0);
    }

    get fontColor() {
        return this._fontChroma.hex();
    }

    get bgColor() {
        return this._bgChroma.hex();
    }

    get markColor() {
        return this._markChroma.hex();
    }
}

const foodScale = chroma.scale(['#78a674', '#909c65', '#b58e6f', '#ab6565']);

class FoodCell extends DetritusCell {
    constructor(col, row, grid, letter, word, nutrition) {
        super(col, row, grid, letter, nutrition);
        if (word == null || word.length == 0) {
            word = getRandomWord()[0];
        }
        const seed = cyrb128(word);
        const random = sfc32(seed[0], seed[1], seed[2], seed[3]);
        this._foodChroma = foodScale(random());
    }

    get _fontChroma() {
        const fontChroma = this._foodChroma.darken(3).saturate(2);
        return chroma.mix(super._fontChroma, fontChroma, this._clampedNutrition * 0.65);
    }

    get _markChroma() {
        const markChroma = this._foodChroma.darken(0.2).saturate(1);
        return chroma.mix(super._markChroma, markChroma, this._clampedNutrition * 0.65);
    }

    get _bgChroma() {
        const bgChroma = this._foodChroma.saturate(1);
        return chroma.mix(super._bgChroma, bgChroma, this._clampedNutrition * 0.65);
    }
}

class DeadCell extends DetritusCell {
    constructor(lifeformCell) {
        super(lifeformCell.col, lifeformCell.row, lifeformCell.grid, lifeformCell.letter, lifeformCell.nutrition);
        this._lifeformFontChroma = chroma(lifeformCell.fontColor);
        this._lifeformMarkChroma = chroma(lifeformCell.markColor);
        this._lifeformBgChroma = chroma(lifeformCell.bgColor);
    }

    get fontColor() {
        chroma.mix(this._lifeformFontChroma, chroma(super.fontColor), 0.65).hex();
    }

    get bgColor() {
        chroma.mix(this._lifeformBgChroma, chroma(super.bgColor), 0.65).hex();
    }

    get markColor() {
        chroma.mix(this._lifeformMarkChroma, chroma(super.markColor), 0.65).hex();
    }
}

// Base class for lifeform cells
class LifeformCell extends Cell {
    constructor(col, row, spawnTime, lifeform) {
        super(col, row, lifeform.grid);
        this.col = col;
        this.row = row;
        this.isAlive = true;
        this.health = 100;
        this._spawnTime = spawnTime;
        this._lifeform = lifeform;
        this._lifetime = 0;
    }

    update(deltaTime) {
        if (this.isAlive) {
            this.setToRender(); // lifeforms are always moving
        }
        this._lifetime += deltaTime;
        if (this.isAlive && this._health <= 0) {
            this._die();
        }
    }

    _die() {
        const deadCell = new DeadCell(this);
        this.grid.removeLayer(this.col, this.row, this.layerType);
        this.grid.setLayerTo(LAYER_TYPES.Detritus, deadCell);
        this.isAlive = false;
    }

    get lifeformType() {
        return this._lifeform.type;
    }

    get layerType() {
        return this._lifeform.layer;
    }
}

// class Nutrient {
//     constructor(amount, fontChroma, bgChroma, markChroma) {
//         this.amount = amount;
//         this.fontChroma = fontChroma;
//         this.bgChroma = bgChroma;
//         this.markChroma = markChroma;
//     }
// }

const healthScaleA = chroma.scale(['#c5c5c2', '#cac998', '#90c558']);
const healthScaleB = chroma.scale(['#9abaad', '#80c6bf', '#6acab2']);

const lifetimeScaleA = chroma.scale(['#ca6454', '#a0cb7a', '#74cf6d', '#58c58d', '#62bb4a']).domain([0, 0.4, 0.63, 0.95, 1]);
const lifetimeScaleB = chroma.scale(['#c987b8', '#a97f94', '#a06193', '#5d9ea2', '#42bdb7']).domain([0, 0.4, 0.63, 0.95, 1]);

const distFromRootScaleA = chroma.scale(['#4bb29f', '#6ab6ac', '#57afae', '#b774c6']).domain([0, 0.1, 0.63, 1]);;
const distFromRootScaleB = chroma.scale(['#60bc7c', '#86bc9b', '#b4c693', '#bb9d70']).domain([0, 0.1, 0.63, 1]);

class MoldCell extends LifeformCell {
    constructor(col, row, spawnTime, lifeform, parentCell) {
        super(col, row, spawnTime, lifeform);
        this._init(parentCell);
        this._children = [];
        this._stomach = new Stomach(this);
        this._soilCell = this.grid.getSoilCell(this.col, this.row);
    }

    _init(parentCell) {
        if (parentCell != null) {
            this._parentCell = parentCell;
            this.health = parentCell.health;
            if (MOLD_CELL_MUTATE_CHANCE < Math.random) {
                this.genes = parentCell.genes.mutate();
            } else {
                this.genes = parentCell.genes;
            }
            parentCell.addChild(this);
            this.distanceFromRoot = parentCell.distanceFromRoot + 1;
        } else { // is root
            this.distanceFromRoot = 0;
            this.genes = this._lifeform.genes;
        }
        // generate letter set
    }

    _eat() {
        let cellToEat;
        const detritusCell = this.grid.getCellFromLayer(this.col, this.row, LAYER_TYPES.Detritus);
        if (detritusCell != null) {
            cellToEat = detritusCell
        } else {
            cellToEat = this._soilCell;
        }
        this._stomach.ingestNutrientFromCell(MOLD_EAT_RATE, cellToEat);
        this.health += this._stomach.digest(MOLD_DIGEST_RATE);
    }

    _updateChromas() {
        const lifetimeChroma = chroma.mix(lifetimeScaleA(Math.min(1, this._lifetime * 0.000003)), lifetimeScaleB(Math.min(1, this._lifetime * 0.000003)), this.genes.getValue(2));
        const distChroma = chroma.mix(distFromRootScaleA(Math.min(1, this.distanceFromRoot * 0.005)), distFromRootScaleB(Math.min(1, this.distanceFromRoot * 0.005)), this.genes.getValue(3));
        this._resultChroma = chroma.mix(healthScaleA(Math.min(1, this.health * 0.01)), healthScaleB(Math.min(1, this.health * 0.01)), this.genes.getValue(1));
        this._resultChroma = chroma.mix(this._resultChroma, distChroma, 0.5);
        this._resultChroma = chroma.mix(this._resultChroma, lifetimeChroma, 0.9 - 0.6 * Math.min(1, this._lifetime * 0.000005)).brighten(0.5 - 0.5 * Math.min(1, this._lifetime * 0.000005)).saturate(0.5 - 0.5 * Math.min(1, this._lifetime * 0.000005));
        const underChroma = chroma(this.grid.getSoilCell(this.col, this.row).markColor);
        this._resultChroma = chroma.mix(underChroma, this._resultChroma, Math.min(this._lifetime * 0.0001, 1));
        this._resultChroma.set('hsl.h', this._resultChroma.hsv()[0] + 10 * (this.genes.getValue(5) - 0.5) + 0.5, 1);
        this._resultChroma = chroma.mix(this._resultChroma, this._stomach.markChroma,  0.8 * Math.min(1, 1.5 * this._stomach.totalNutrition));
    }

    receiveNutrientColor(nutrients, chroma) {

    }

    update(deltaTime) {
        super.update(deltaTime);
        this._updateChromas();
        this._eat();
    }

    addChild(child) {
        this._children.push(child);
    }

    get allAdjacentCells() {
        return [...this._children, this.parent];
    }

    get nutrition() {
        return this._stomach.totalNutrition;
    }

    get letter() {
        const letterList = this.genes.getLetterList();
        const lifetimeRatio = this._lifetime * 0.001 * MOLD_LETTER_DIST_INF;
        const len = letterList.length - 1;
        return letterList[Math.floor(lifetimeRatio * len) % len]; // already a code
    }

    get fontColor() {
        return this._resultChroma.saturate(1.5).darken(2.5).hex();
    }

    get markColor() {
        return this._resultChroma.hex();
    }

    get bgColor() {
        return this._resultChroma.desaturate(1.5).brighten(0.5).hex();
    }

    get isRoot() {
        return this._parentCell == null;
    }
}