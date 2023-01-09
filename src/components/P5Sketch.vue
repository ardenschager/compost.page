<script setup>
import { onMounted, onUnmounted, ref, reactive } from 'vue';
import P5 from 'p5';

const props = defineProps(['width', 'height', 'data']);

const sketch = (p5) => {

    let sketchWidth = 1920;
    let sketchHeight = 1080;
    let cellWidth = sketchWidth / props.width;
    let cellHeight = sketchHeight / props.height;
    let cellPadding = 5;
    let grid = null;

    let font;

    class Cell {
        constructor(col, row) {
            this._col = col;
            this._row = row;
            this._letter = '.';
            this._bgColor = 'white';
            this._markColor = 'white';
            this._fontColor = 'black';
        }

        draw(datum) {
            this._letter = datum.letter;
            this._bgColor = datum.bgColor;
            this._markColor = datum.markColor;
            this._fontColor = datum.fontColor;
            p5.fill(this._bgColor);
            const x = this._col * cellWidth;
            const y = this._row * cellHeight;
            p5.rect(x, y, cellWidth, cellHeight);
            p5.fill(this._markColor);
            p5.rect(x + cellPadding, y + cellPadding, cellWidth - cellPadding * 2, cellHeight - cellPadding * 2);
            p5.text(this._letter, x, y);
        }
    }

    class Grid {
        constructor() {
            this._cells = [];
            for (let r = 0; r < props.height; r++) {
                this._cells.push([]);
                for (let c = 0; c < props.width; c++) {
                    this._cells[r].push(new Cell(c, r));
                }
            }
            // p5.textFont(font);
            p5.textAlign(p5.CENTER, p5.CENTER);
        }

        draw(c, r, datum) {
            p5.textSize(sketchWidth / props.width);
            this._cells[r][c].draw(datum)
        }
    }

    p5.preload = () => {
        // font = p5.loadFont('../assets/unifont-15.0.01.ttf');
    }

    p5.setup = () => {
        const canvas = p5.createCanvas(sketchWidth, sketchHeight);
        canvas.parent('sketch-canvas');
        grid = new Grid();
        p5.frameRate(1);
        p5.noStroke();
    }

    p5.draw = () => {
        p5.background(255);
        for (let c = 0; c < props.width; c++) {
            for (let r = 0; r < props.height; r++) {
                const idx = r * props.width + c;
                const data = props.data[idx];
                if (data != null) {
                    grid.draw(c, r, data);
                }
            }
        }
    }
}

onMounted(() => {
    new P5(sketch);
});

</script>

<template>
    <div id="sketch-canvas"></div>
</template>

<style scoped>
    #sketch-canvas {
        width: 500px;
        height: 500px;
        overflow: hidden;
        display: block;
        margin: 0;
        padding: 0;
    }
</style>
