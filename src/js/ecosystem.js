class Ecosystem {
    constructor(grid) {
        this.grid = grid;
        this.lifeforms = [];
        this.molds = [];
    }

    spawn(type) {
        if (type == LIFEFORM_TYPES.Mold) {
            const mold = new Mold();
            this.lifeforms.push(mold);
            this.molds.push(mold);
        }
    }

    update() {
        if (Math.random() < MOLD_SPAWN_CHANCE && this.molds.length < MAX_NUM_MOLDS) {
            this.spawn(LIFEFORM_TYPES.Mold);
        }
        for (const lifeform of this.lifeforms) {
            lifeform.update();
        }
    }
}