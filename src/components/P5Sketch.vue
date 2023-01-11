<script setup>
import { onMounted, ref, watch } from 'vue';
import P5 from 'p5';

const props = defineProps(['gridWidth', 'gridHeight', 'data']);
const sketchCanvas = ref(null);

let sketchWidth = ref(0);
let sketchHeight = ref(0);
let dataUpdated = false;


const sketch = (p5) => {

    let cellWidth = 0;
    let cellHeight = 0;
    let cellPadding = 2;
    let grid = null;

    const NUM_RENDER_BUCKETS = 5;

    let font;

    class Cell {
        constructor(col, row) {
            this._col = col;
            this._row = row;
            this.timeSinceLastDraw = 0;
            const idx = row * props.gridWidth + col;
        }

        set(datum) {
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

        }

        draw() {
            if (this.timeSinceLastDraw > this._renderingDelay) {
                p5.fill(this._bgColor);
                const x = this._col * cellWidth;
                const y = this._row * cellHeight;
                p5.rect(x, y, cellWidth, cellHeight);
                p5.fill(this._markColor);
                p5.rect(x + cellPadding, y + cellPadding, cellWidth - cellPadding * 2, cellHeight - cellPadding * 2);
                p5.fill(this._fontColor);
                p5.text(String.fromCharCode(this._letter), x + cellWidth * 0.5, y + cellHeight * 0.5);
                this.timeSinceLastDraw = 0;
            } else {
                this.timeSinceLastDraw += p5.deltaTime;
            }
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

        setToDraw(c, r, datum, simUpdateFps) {
            this._cells[r][c].set(datum);
            const renderingDelay = simUpdateFps * Math.floor(Math.random() * NUM_RENDER_BUCKETS);
            this._cells[r][c]._renderingDelay = renderingDelay;
        }

        draw() {
            p5.textSize(sketchWidth.value / props.gridWidth);
            for (let r = 0; r < props.gridHeight; r++) {
                for (let c = 0; c < props.gridWidth; c++) {
                    this._cells[r][c].draw();
                }
            }
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
        p5.background(255);
        cellWidth = sketchWidth.value / (Number(props.gridWidth) + 1);
        cellHeight = sketchHeight.value / (Number(props.gridHeight) + 1);
        const canvas = p5.createCanvas(sketchWidth.value, sketchHeight.value);
        if (sketchCanvas.value == null) return;
        canvas.parent(sketchCanvas.value);
        grid = new Grid();
        p5.noStroke();
        for (let c = 0; c < props.gridWidth; c++) {
            for (let r = 0; r < props.gridHeight; r++) {
                grid.setToDraw(c, r);
            }
        }
    }

    p5.draw = () => {
        p5.frameRate(props.data.fps * NUM_RENDER_BUCKETS);
        for (let c = 0; c < props.gridWidth; c++) {
            for (let r = 0; r < props.gridHeight; r++) {
                const idx = r * props.gridWidth + c;
                const datum = props.data[idx];
                if (grid != null) {
                    if (datum != null && dataUpdated) {
                        grid.setToDraw(c, r, datum, props.data.fps);
                    } 
                }
            }
        }
        grid.draw();
        dataUpdated = false;
    }

    p5.windowResized = () => {
        p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
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
    if (newProps.data != null) {
        if (p5Sketch == null) {
            p5Sketch = new P5(sketch);
        } else {
            dataUpdated = true;
        }
    }
});

</script>

<template>
    <div ref="sketchCanvas"></div>
</template>

<style scoped>
#sketch-canvas {
    width: 100%;
    height: 100%;
    margin: 0 auto;
}
</style>
