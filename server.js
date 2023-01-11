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
    if (scrapeString == null || scrapeString.length == 0) {
        console.warning("scrape string blank, cannot analyze");
        return;
    }
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
        if (predictions == null) {
            // console.warn('TF predictions empty');
            continue;
        }
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

const REANALYSIS_INTERVAL = 1000 * 60 * 30;

class DataHelper {
    constructor() {
        this._results = {};
        this._timeStamps = {};
    }

    save(url, tfResult) {
        this._results[url] = tfResult;
        this._timeStamps[url] = Date.now();
        return tfResult;
    }

    isFresh(url) {
        return this.isCached(url) && this.getTimeSinceLastSave(url) < REANALYSIS_INTERVAL;
    }

    refresh() {
        for (const url in Object.keys(this._results)) {
            if (!this.isFresh(url)) {
                delete this._results[url];
                delete this._timeStamps[url];
            }
        }
    }

    getResult(url) {
        if (this.isFresh(url)) {
            console.log("Cache hit on " + url);
            return this._results[url];
        } else {
            return null;
        }
    }

    getTimeSinceLastSave(url) {
        return Date.now() - this._timeStamps[url];
    }

    isCached(url) {
        return this._timeStamps[url] != null;
    }
}

const dataHelper = new DataHelper();
const NUM_ATTEMPTS = 15;

async function processData(url) {
    for (let i = 0; i < NUM_ATTEMPTS; i++) {
        try {
            console.log(url);
            const response = await fetch(url);
            let scrape = await response.text();
            scrape = sanitizeHtml(scrape, SANITIZE_OPTIONS);
            scrape = htmlToText.convert(scrape, { wordwrap: false });
            scrape = scrape.replace(/[^\x00-\x7F]/g, ""); // ascii only
            scrape = scrape.replace(/(\r\n|\n|\r)/gm, ""); // no whitespace
            let analysis = await analyzeResult(scrape);
            if (scrape != null && scrape.length > 0 && analysis != null) {
                let result = dataHelper.save(url, analysis);
                console.log("Analysis complete on: " + url);
                return result;
            } else {
                console.warning("Analysis failed, trying again on " + url);
            }
            // scrape = processSentiment(scrape);
        } catch (e) {
            console.warn("Scrape failed, trying for the " + i + "th time");
            console.warn(e);
        }
    }
}

const DEFAULT_URLS = [
    'angelfire.com/trek/caver/page9.html',
    'cameronsworld.net', 
    'foxnews.com',
    'nytimes.com', 
    'pastebin.com/FxKf1Xnz',
    'taxi1010.com/index0.htm', 
    'taxi1010.com/juicy-bonus/',
    'timecube.2enp.com/',
    'tinyurl.com/50-affirmations',
    'tinyurl.com/sexual-dimorphism',
    'tinyurl.com/suffering-faq',
    'www.yyyyyyy.info/',
]

function prepUrl(url) {
    const prefix0 = "http://";
	const prefix1 = "https://";
	if (
		url.substr(0, prefix0.length) !== prefix0 &&
		url.substr(0, prefix1.length) !== prefix1
	) {
		url = prefix0 + url;
	}
    return url;
}

// Cron job
setInterval(async () => {
    dataHelper.refresh();
    console.log("starting re-analysis cron job");
    for (let url of DEFAULT_URLS) {
        await processData(prepUrl(url));
    }
    console.log("re-analysis cron job complete");
}, REANALYSIS_INTERVAL);

async function sendBackScrape(url, res) {
	let scrape = "";
    url = prepUrl(url);
    let result = dataHelper.getResult(url);
    if (result == null) {
        result = await processData(url);
    }
    if (result != null) {
        console.log(result);
        console.log("Sending result for " + url)
        res.send({ scrape: result });
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

httpServer.listen(PORT, async () => {
	console.log("listening on :" + PORT);
    console.log("initial scrape: ");
    // scrape on init
    for (let url of DEFAULT_URLS) {
        url = prepUrl(url);
        await processData(url);
    }
    console.log("done")
});
