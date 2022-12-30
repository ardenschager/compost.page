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
import toxicity from '@tensorflow-models/toxicity';
// require('@tensorflow/tfjs-node');

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

const MAX_LEN = 200 * 100;
// tokenize into sentences, analyze each sentence, and populate letter array
// with letters and analysis
async function analyzeResult(scrapeString) {
    const sentenceTokenizer = new natural.SentenceTokenizer();
    const wordTokenizer = new natural.WordPunctTokenizer();

    const Analyzer = natural.SentimentAnalyzer;
    const stemmer = natural.PorterStemmer;
    const sentimentAnalyzer = new Analyzer("English", stemmer, "afinn");
    const sentences = sentenceTokenizer.tokenize(scrapeString);
    // console.log(sentences);
    let result = [];
    for (let sentence of sentences) {
        let predictions = await getPredictions(sentence);
        let words = wordTokenizer.tokenize(sentence);
        let sentiment = sentimentAnalyzer.getSentiment(words);
        let tfResults = {};
        predictions.forEach((element) => {
            tfResults[element.label] = element.results[0].probabilities[1];
        });
        tfResults["sentiment"] = sentiment;
        for (let word of words) {
            word = word + " ";
            const letters = [...word];
            for (let letter of letters) {
                const gridUnit = {letter: letter, analysis: tfResults, word: word, sentence: sentence};
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
const PORT = process.env.PORT || 3001;

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));
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
	try {
		// let response; // todo: learn promise
		// let promise = new Promise((resolve, reject) => {

		// });
		const response = await fetch(url);
		scrape = await response.text();
		scrape = sanitizeHtml(scrape, SANITIZE_OPTIONS);
		scrape = htmlToText.convert(scrape, { wordwrap: false });
		scrape = scrape.replace(/(\r\n|\n|\r)/gm, "");
        scrape = await analyzeResult(scrape);
		// scrape = processSentiment(scrape);
		res.send({ scrape: scrape });
	} catch (e) {
		console.warn(e);
	}
}

// define a route - what happens when people visit /
app.get("/", function (req, res) {
	res.sendFile(__dirname + "/index.html");
});

app.post("/scrape", function (req, res) {
	const targetUrl = req.body.target;
	console.log("scrape request received for: " + targetUrl);
	sendBackScrape(targetUrl, res);
});

httpServer.listen(PORT, () => {
	console.log("listening on :" + PORT);
});
