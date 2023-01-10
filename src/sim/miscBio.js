class Stomach {
    constructor(cell) {
        this._cell = cell;
        this._totalNutrition = 0;
        this._chroma = chroma('green');
        this._fromOthers = [];
    }

    ingestNutrientFromCell(rate, cell) {
        const nutrition = cell.getConsumed(rate) * 0.5;
        this._totalNutrition += nutrition;
        let ratio = nutrition / this._totalNutrition;
        if (ratio !== ratio) return;
        ratio = Math.max(0, Math.min(1, ratio));
        if (cell.markColor != null)
            this._chroma = chroma.mix(this._chroma, chroma(cell.markColor), ratio);
        // propogate
        // for (let nutrientChroma of this._fromOthers) {
        //     this._totalNutrition += nutrientChroma.nutrient;
        //     let ratio = nutrientChroma.nutrient / this._totalNutrition;
        //     this._chroma = chroma.mix(this._chroma, chroma(cell.markColor), ratio);
        // }
        // this._fromOthers.length = 0;
        // for (let cell of this._cell.allAdjacentCells()) {
            
        // }
    }

    receiveFromOtherCell(nutrient, chroma) {
        this._fromOthers.push({nutrient: nutrient, chroma: chroma});
    }

    digest(rate) {
        let result = this._totalNutrition - rate;
        if (result < 0) {
            result = this._totalNutrition;
            this._totalNutrition = 0;
        } else {
            this._totalNutrition = result;
        }
        return result;
    } 

    set totalNutrition(value) {
        if (value <= 0) { // clamp
            this._totalNutrition = 0;
        } else {
            this._totalNutrition = value;
        }
    }

    get totalNutrition() {
        return this._totalNutrition;
    }

    get markChroma() {
        return this._chroma;
    }
}

class Gene {
    constructor(seedStr, hasLetterList=false) {
        this.seedStr = seedStr;
        const seed = cyrb128(seedStr);
        this.random = sfc32(seed[0], seed[1], seed[2], seed[3]);
        if (hasLetterList) {
            this._generateLetterList();
        }
        this.value = getNormallyDistributedRandomNumber(0.5, 0.22, this.random);
    }

    set value(newValue) {
        this._value = Math.min(1, Math.max(0, newValue));
    }

    get value() {
        return this._value;
    }

    get letterList() {
        return this._letterList;
    }

    _generateLetterList() {
        this._letterList = [];
        for (let i = 0; i < this.seedStr.length; i++) {
            const letter = randomUnicode(this.random);
            this._letterList.push(letter);
        }
    }
}

class Genes {
    // accepts either params.numGenes or a list of seed strings
    constructor(params) {
        this._genes = [];
        if (params.seedStrs != null) {
            for (let i = 0; i < params.seedStrs.length; i++) {
                this._genes.push(new Gene(params.seedStrs[i], i==0));
            }
        } else {
            for (let i = 0; i < params.numGenes; i++) {
                const randomWord = getRandomWord(); // words are in the DNA
                this._genes.push(new Gene(randomWord, i==0)); // todo: generalize
            }
        }
    }

    get seedStrs() {
        const _seedStrs = [];
        for (let gene of this._genes) {
            _seedStrs.push(gene.seedStr);
        }
        return _seedStrs;
    }

    getLetterList() {
        return this._genes[0].letterList;
    }

    getGene(idx) {
        return this._genes[idx];
    }

    getValue(idx) {
        return this._genes[idx].value;
    }

    getLetter(idx) {
        return this._genes[idx].letter;
    }

    getRandFn(idx) {
        return this._genes[idx].random;
    }

    // Must be same size / species
    spliceWith(otherGenes) {
        const seedStrs = [];
        for (let i = 0; i < this._genes.length; i++) {
            const gene = this._genes[i];
            const otherGene = otherGenes[i];
            if (Math.random() > 0.5) {
                seedStrs.push(gene.seedStr);
            } else {
                seedStrs.push(otherGene.seedStr);
            }
        }
        return new Genes({seedStrs: seedStrs});
    }

    mutate() {
        const seedStrs = [];
        const mutateIdx = Math.floor(Math.random() * this._genes.length);
        for (let idx = 0; idx < this._genes.length; i++) {
            let seedStr;
            if (idx == mutateIdx) {
                seedStr = getRandomWord();
            } else {
                seedStr = this._genes[idx].seedStr;
            }
            seedStrs.push(seedStr);
        }
        return new Genes({seedStrs: seedStrs});
    }
}