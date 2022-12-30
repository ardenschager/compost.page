// --- constants

const DLA_TRIES = 200;
const MIN_TRIES = 1;
const OVERSCALE = 0.56; 
const LIFESPAN = 5000;
const LETTER_SWITCH_TIMEOUT = 999;
const NUM_STARTING_PLANTS = 5;
const SIM_FRAME_MOD = 1;
const NUM_TICKS_PER_FRAME = 5;
const START_GRID_CHAR = '.';
const IGNORE_SPACES = true;
const WILL_DIE = false;
const TRAVERSE_SPACE_CHANCE = 0.1;

const MOLD_SPAWN_CHANCE = 0.01;
const MAX_NUM_MOLDS = 5;

const MOVESET = [-1, 0, 1];

const LIFEFORM_TYPES = {
    Mold: 'mold',
}

const SYMBOL_MAP = new Proxy(new Map([
    ['a', '.'],
    ['b', ':'],
    ['c', '#'],
    ['d', '@'],
    ['e', '%'],
    ['f', '^'],
    ['g', '*'],
    ['h', ','],
    ['i', '0'],
    ['j', '|'],
    ['k', '~'],
    ['l', '<'],
    ['m', '>'],
    ['n', '['],
    ['o', ']'],
    ['p', '&'],
    ['q', '?'],
    ['r', '_'],
    ['s', '='],
    ['t', '+'],
    ['u', '('],
    ['v', ')'],
    ['w', '!'],
    ['x', '&'],
    ['y', '&'],
    ['z', '/'],
    ['.', '.'],
    [':', ':'],
    ['#', '#'],
    ['@', '@'],
    ['%', '%'],
    ['^', '^'],
    ['*', '*'],
    [',', ','],
    ['0', '0'],
    ['|', '|'],
    ['~', '~'],
    ['<', '<'],
    ['>', '>'],
    ['[', '['],
    [']', ']'],
    ['&', '&'],
    ['?', '?'],
    ['_', '_'],
    ['=', '='],
    ['+', '+'],
    ['(', '('],
    [')', ')'],
    ['!', '!'],
    ['&', '&'],
    ['&', '&'],
    ['/', '/']
]), {
    get: function(target, id) {
        return target.has(id) ? target.get(id) : target.get('g'); // fall back to *
    },
});

// const GRAY = chroma({
//     h: 300,
//     s: 0.05,
//     l: 0.6433
// });

// const CREME = chroma({
//     h: 100,
//     s: 0.2,
//     l: 0.9
// });

// const WHITE = chroma({
//     h: 100,
//     s: 0.0,
//     l: 1
// });