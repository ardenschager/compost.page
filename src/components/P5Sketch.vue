<script setup>
import { onMounted, ref, watch } from 'vue';
import P5 from 'p5';

const props = defineProps(['gridWidth', 'gridHeight', 'data']);
const sketchCanvas = ref(null);

let sketchWidth = ref(0);
let sketchHeight = ref(0);

const sketch = (p5) => {

    let cellWidth = 0;
    let cellHeight = 0;
    let cellPadding = 2;
    let grid = null;

    let font;

    class Cell {
        constructor(col, row) {
            this._col = col;
            this._row = row;
            const idx = row * props.gridWidth + col;
        }

        draw(datum) {
            if (datum == null) {
                this._letter = '.';
                this._bgColor = 'white';
                this._markColor = 'white';
                this._fontColor = 'black';
            } else {
                this._letter = datum.letter;
                this._bgColor = datum.bgColor;
                this._markColor = datum.markColor;
                this._fontColor = datum.fontColor;
                if (this._firstDraw) {
                    this._firstDraw = true;
                }
            }
            p5.fill(this._bgColor);
            const x = this._col * cellWidth;
            const y = this._row * cellHeight;
            p5.rect(x, y, cellWidth, cellHeight);
            p5.fill(this._markColor);
            p5.rect(x + cellPadding, y + cellPadding, cellWidth - cellPadding * 2, cellHeight - cellPadding * 2);
            p5.fill(this._fontColor);
            p5.text(String.fromCharCode(this._letter), x + cellWidth * 0.5, y + cellHeight * 0.5);
        }
    }

    class Grid {
        constructor() {
            this._cells = [];
            for (let r = 0; r < props.gridHeight; r++) {
                this._cells.push([]);
                for (let c = 0; c < props.gridWidth; c++) {
                    this._cells[r].push(new Cell(c, r));
                }
            }
            p5.textFont(font);
            p5.textAlign(p5.CENTER, p5.CENTER);
        }

        draw(c, r, datum) {
            p5.textSize(sketchWidth.value / props.gridWidth);
            this._cells[r][c].draw(datum)
        }
    }

    p5.preload = () => {
        // font = p5.loadFont('cour.ttf');
        // textStyle(BOLD);
        // font = p5.loadFont('seguisym.ttf');
        // font = p5.textFont('Calibri');
        // pixelDensity(0.9);
    }

    p5.setup = () => {
        font = p5.textFont('Calibri');
        cellWidth = sketchWidth.value / (Number(props.gridWidth) + 1);
        cellHeight = sketchHeight.value / (Number(props.gridHeight) + 1);
        const canvas = p5.createCanvas(sketchWidth.value, sketchHeight.value);
        if (sketchCanvas.value == null) return;
        canvas.parent(sketchCanvas.value);
        grid = new Grid();
        p5.noStroke();
        for (let c = 0; c < props.gridWidth; c++) {
            for (let r = 0; r < props.gridHeight; r++) {
                grid.draw(c, r);
            }
        }
    }

    p5.draw = () => {
        p5.background(255);
        p5.frameRate(props.data.fps);
        for (let c = 0; c < props.gridWidth; c++) {
            for (let r = 0; r < props.gridHeight; r++) {
                const idx = r * props.gridWidth + c;
                const data = props.data[idx];
                if (grid != null && data != null) {
                    grid.draw(c, r, data);
                }
            }
        }
    }
}

onMounted(() => {
    const scrollBottom = screen.availHeight;
    const elementTop = sketchCanvas.value.offsetTop;
    sketchHeight.value = scrollBottom - elementTop - 170;
    sketchWidth.value = screen.availWidth;
});

let p5Sketch = null;
watch(props, (newProps, oldProps) => {
    if (newProps.data != null && p5Sketch == null) {
        p5Sketch = new P5(sketch);
    }
});

</script>

<template>
    <div ref="sketchCanvas"></div>
</template>

<style scoped>
    #sketch-canvas {
        width: v-bind('sketchWidth.value');
        height: v-bind('sketchHeight.value');
        margin: 0 auto;
    }
</style>
