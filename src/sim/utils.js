// --- helper functions

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function randomCharString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function getRandomElem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// https://mika-s.github.io/javascript/random/normal-distributed/2019/05/15/generating-normally-distributed-random-numbers-in-javascript.html
function getNormallyDistributedRandomNumber(mean, stddev, rand=Math.random) {
    function boxMullerTransform() {
        const u1 = rand();
        const u2 = rand();
        
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
        
        return { z0, z1 };
    }
    const { z0, _ } = boxMullerTransform();
    return z0 * stddev + mean;
}

// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
const cyrb128 = function(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

const sfc32 = function(a, b, c, d) {
    return function() {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
      var t = (a + b) | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
}

function containsAnyLetters(str) {
    return /[a-z]/i.test(str);
}

function lerp (start, end, amt){
    return (1-amt)*start+amt*end
}

// https://github.com/everestpipkin/never/blob/master/template.html
// function randomUnicodeChar (uniRam){
//     var chars = [];
//     if (Math.random() > 0.5) {
//         uniRam = Math.floor(Math.random() * 17535);
//     }
//     else if (Math.random() > 0.3) {
//         uniRam = Math.floor(Math.random() * 3190) + 8600;
//     }
//     else {
//         uniRam = Math.floor(Math.random() * 750);
//     }

// 	var r = String.fromCharCode(uniRam + Math.floor(Math.random()*200))
// 	//var r = Math.random().toString(36).substring(2,3);
// 	//console.log(r)
//     return r;
// }