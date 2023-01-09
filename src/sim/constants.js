// --- constants

// sim
const SEND_MESSAGE_BASE_INTERVAL = 250;
const SEND_INTERVAL_INCREASE = 1750; // increases with num lifeform cells

const LOOP_INVERVAL = 50;
const SIM_FRAME_MOD = 1;
const NUM_TICKS_PER_FRAME = 3;

// mold
const NUM_STARTING_MOLDS = 1;
const MAX_NUM_MOLDS = 3;
const MOLD_NUM_GENES = 10;
const MOLD_DLA_MOVESET = [-1, 0, 1];
const MOLD_DLA_TRIES = 300;
const MOLD_MIN_DLA_TRIES = 50;
const MOLD_CAN_DIE = true;
const MOLD_TRAVERSE_SPACE_INF = 0.3;
const MOLD_SPAWN_BASE_PROB = 0.0005;
const MOLD_NUTRITION_GROWTH_INF = 1.2;
const MOLD_NUTRITION_SPAWN_INF = 0.55;
const MOLD_BASE_LIFESPAN = 10000 * 60 * 3;
const MOLD_CELL_DEGRADE_RATE = 0.01;
const MOLD_EAT_RATE = 0.002;

// soil
const SOIL_NOISE_NUTRITION_INF = 0.5;
const SOIL_BASE_NUTRITION = 0.01; // [0, 1]
const SOIL_MIN_NUTRITION = 0.001;
const SOIL_SENTIMENT_FERTILITY_CUTOFF = 0.825;

// Detritus
const FOOD_NUTRITION_CUTOFF = 0.75; // for perlin noise
const FOOD_NUTRITION_SCALE = 1.6;


const LIFEFORM_TYPES = {
    Default: 'default', // should not occur
    Mold: 'mold',
}

const LAYER_TYPES = {
	Default: "default", // should not render
	Soil: "soil",
	Mold: "mold",
    Detritus: "detritus",
};

// const SYMBOL_MAP = new Proxy(new Map([
//     ['a', '.'],
//     ['b', ':'],
//     ['c', '#'],
//     ['d', '@'],
//     ['e', '%'],
//     ['f', '^'],
//     ['g', '*'],
//     ['h', ','],
//     ['i', '0'],
//     ['j', '|'],
//     ['k', '~'],
//     ['l', '<'],
//     ['m', '>'],
//     ['n', '['],
//     ['o', ']'],
//     ['p', '&'],
//     ['q', '?'],
//     ['r', '_'],
//     ['s', '='],
//     ['t', '+'],
//     ['u', '('],
//     ['v', ')'],
//     ['w', '!'],
//     ['x', '&'],
//     ['y', '&'],
//     ['z', '/'],
//     ['.', '.'],
//     [':', ':'],
//     ['#', '#'],
//     ['@', '@'],
//     ['%', '%'],
//     ['^', '^'],
//     ['*', '*'],
//     [',', ','],
//     ['0', '0'],
//     ['|', '|'],
//     ['~', '~'],
//     ['<', '<'],
//     ['>', '>'],
//     ['[', '['],
//     [']', ']'],
//     ['&', '&'],
//     ['?', '?'],
//     ['_', '_'],
//     ['=', '='],
//     ['+', '+'],
//     ['(', '('],
//     [')', ')'],
//     ['!', '!'],
//     ['&', '&'],
//     ['&', '&'],
//     ['/', '/']
// ]), {
//     get: function(target, id) {
//         return target.has(id) ? target.get(id) : target.get('g'); // fall back to *
//     },
// });