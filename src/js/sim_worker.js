importScripts('./utils.js');
importScripts('./constants.js');
importScripts('./ecosystem.js');
importScripts('./mold.js');
importScripts('./simulation.js');
importScripts('./chroma.js');
importScripts('./grid.js');

let simulation;

self.onmessage = function(e) {
    if (e.data[0] === 'init') {
        simulation = new Simulation(e.data[1]);
        simulation.onCompleteFrame = () => {
            self.postMessage(simulation.frameData);
        }
        simulation.start();
    }
}