importScripts('./chroma.js'); // chroma.js library
importScripts('./perlin.js'); // perlin noise library
importScripts('./utils.js');
importScripts('./randomWords.js');
importScripts('./constants.js');
importScripts('./cells.js');
importScripts('./lifeforms.js');
importScripts('./simulation.js');
importScripts('./grid.js');

let simulation;

self.onmessage = function(e) {
    if (e.data[0] === 'init') {
        simulation = new Simulation(e.data[1]);
        simulation.sendResults = () => {
            self.postMessage(simulation.popFrameData());
        }
        simulation.start();
    }
    if (e.data[0] === 'addFood') {
        simulation.addFood();
    }
    if (e.data[0] === 'spawnMold') {
        simulation.spawnMold();
    }
}