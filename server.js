import express from "express";
import http from "http";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import sanitizeHtml from "sanitize-html";
import htmlToText from "html-to-text";
import bodyParser from "body-parser";

// These lines make "require" available
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const natural = require('natural');
const toxicity = require('@tensorflow-models/toxicity');
require('@tensorflow/tfjs-node');

const threshold = 0.9;
let tfModel = null;
// Load the model. Users optionally pass in a threshold and an array of
// labels to include.
toxicity.load(threshold).then(model => {

    tfModel = model;
});

async function getPredictions(sentence) {
    if (tfModel != null) {
        return await tfModel.classify(sentence).then(predictions => {
            return predictions;
        });
    }
}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

const MAX_LEN = 120 * 60; // change me
// tokenize into sentences, analyze each sentence, and populate letter array
// with letters and analysis
async function analyzeResult(scrapeString) {
    const tokenizer = new natural.RegexpTokenizer({pattern: /[\!\.\?\*\-\~\(\)\[\]\{\}]/});
    const wordTokenizer = new natural.WordPunctTokenizer();

    const Analyzer = natural.SentimentAnalyzer;
    const stemmer = natural.PorterStemmer;
    const sentimentAnalyzer = new Analyzer("English", stemmer, "afinn");
    const sentences = tokenizer.tokenize(scrapeString);
    shuffleArray(sentences);
    let result = [];

    for (let sentence of sentences) {
        let predictions = await getPredictions(sentence);
        sentence = sentence + " "; // space between sentences
        let words = wordTokenizer.tokenize(sentence);
        let sentiment = 1 - (sentimentAnalyzer.getSentiment(words) * 0.5 + 0.5);
        let tfResults = {};
        predictions.forEach((element) => {
            tfResults[element.label] = element.results[0].probabilities[1];
        });
        if (isNaN(sentiment)) sentiment = 0.5;
        tfResults["sentiment"] = sentiment;
        for (let word of words) {
            // const wordSentiment = 1 - (sentimentAnalyzer.getSentiment([word]) * 0.5 + 0.5);
            // tfResults["word_sentiment"] = wordSentiment;
            word = word + " ";
            const letters = [...word];
            for (let i = 0; i < letters.length; i++) {
                const letter = letters[i];
            const gridUnit = { letter: letter, idx: i, analysis: tfResults, word: word, /* sentence: sentence */ };
                result.push(gridUnit);
            }
        }
        if (result.length > MAX_LEN) break;
    }
    return result;
}
// import 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());
app.use(express.static("dist"));
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.session({
//   secret: "secret",
//   cookie: {
//       httpOnly: true,
//       secure: true
//   }
// }));
app.set("port", PORT);

const httpServer = http.createServer(app);

// mod.cjs
// const socketServer = require("socket.io");
// const io = socketServer(httpServer, {
//   cors: {
//     origin: "http://localhost:8080",
//   },
// });

const SANITIZE_OPTIONS = {
	allowedTags: [
		"address",
		"article",
		"aside",
		"footer",
		"header",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"hgroup",
		"main",
		"nav",
		"section",
		"blockquote",
		"dd",
		"div",
		"dl",
		"dt",
		"figcaption",
		"figure",
		"hr",
		"li",
		"main",
		"ol",
		"p",
		"pre",
		"ul",
		"a",
		"abbr",
		"b",
		"bdi",
		"bdo",
		"br",
		"cite",
		"data",
		"dfn",
		"em",
		"i",
		"kbd",
		"mark",
		"q",
		"rb",
		"rp",
		"rt",
		"rtc",
		"ruby",
		"s",
		"samp",
		"small",
		"span",
		"strong",
		"sub",
		"sup",
		"time",
		"u",
		"var",
		"wbr",
		"caption",
		"col",
		"colgroup",
		"table",
		"tbody",
		"td",
		"tfoot",
		"th",
		"thead",
		"tr",
	],
	disallowedTagsMode: "discard",
	allowedAttributes: {
		a: ["name", "target"],
	},
	selfClosing: [
		"img",
		"br",
		"hr",
		"area",
		"base",
		"basefont",
		"input",
		"link",
		"meta",
	],
	allowedSchemes: ["http", "https"],
	allowedSchemesByTag: {},
	allowedSchemesAppliedToAttributes: ["src", "cite"],
	allowProtocolRelative: true,
	enforceHtmlBoundary: false,
};

async function fulfillWithTimeLimit(timeLimit, task){
    let timeout;
    const timeoutPromise = new Promise((resolve, reject) => {
        timeout = setTimeout(() => {
            resolve("Promise timed out");
        }, timeLimit);
    });
    const response = await Promise.race([task, timeoutPromise]);
    if(timeout){ //the code works without this but let's be safe and clean up the timeout
        clearTimeout(timeout);
    }
    return response;
}

// https://javascript.plainenglish.io/lets-make-a-retry-mechanism-a339307d44bc
const retry = (callback, times = 5, waitout = 100) => {
    let numberOfTries = 0;
    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            numberOfTries++;
            if (numberOfTries === times) {
                console.log(`Trying for the last time... (${times})`);
                clearInterval(interval);
            }
            try {
                await callback();
                clearInterval(interval);
                console.log(`Operation successful, retried ${numberOfTries} times.`);
                resolve();
            } catch (err) {
                console.log(`Unsuccessful, retried ${numberOfTries} times... ${err}`);
            }
        }, waitout);
    });
};

async function sendBackScrape(url, res) {
	let scrape = "";
	const prefix0 = "http://";
	const prefix1 = "https://";
	if (
		url.substr(0, prefix0.length) !== prefix0 &&
		url.substr(0, prefix1.length) !== prefix1
	) {
		url = prefix0 + url;
	}
    for (let i = 0; i < 10; i++) {
        try {
            const response = await fetch(url);
            scrape = await response.text();
            scrape = sanitizeHtml(scrape, SANITIZE_OPTIONS);
            scrape = htmlToText.convert(scrape, { wordwrap: false });
            scrape = scrape.replace(/[^\x00-\x7F]/g, ""); // ascii only
            scrape = scrape.replace(/(\r\n|\n|\r)/gm, ""); // no whitespace
            scrape = await analyzeResult(scrape);
    
            console.log("Analysis complete on: " + url);
            // scrape = processSentiment(scrape);
            res.send({ scrape: scrape });
            break;
        } catch (e) {
            console.warn("Scrape failed, trying for the " + i + "th time");
        }
    }
}

// define a route - what happens when people visit /
app.get("/", function (req, res) {
    console.log(__dirname + "/dist/index.html")
	res.sendFile(__dirname + "/dist/index.html");
});

app.get("/sim", function (req, res) {
    console.log(__dirname + "/dist/index.html")
	res.sendFile(__dirname + "/dist/index.html");
});

app.post("/scrape", function (req, res) {
	const targetUrl = req.body.target;
	console.log("Scrape request received for: " + targetUrl);
	sendBackScrape(targetUrl, res);
});

httpServer.listen(PORT, () => {
	console.log("listening on :" + PORT);
});
