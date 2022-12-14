
import express from 'express';
import http from 'http';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import sanitizeHtml from 'sanitize-html';
import htmlToText from 'html-to-text';
import bodyParser from 'body-parser';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3001;

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.session({
//   secret: "secret",
//   cookie: {
//       httpOnly: true,
//       secure: true
//   }
// }));
app.set('port', PORT);

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
		"address", "article", "aside", "footer", "header", "h1", "h2", "h3", "h4",
		"h5", "h6", "hgroup", "main", "nav", "section", "blockquote", "dd", "div",
		"dl", "dt", "figcaption", "figure", "hr", "li", "main", "ol", "p", "pre",
		"ul", "a", "abbr", "b", "bdi", "bdo", "br", "cite", "data", "dfn",
		"em", "i", "kbd", "mark", "q", "rb", "rp", "rt", "rtc", "ruby", "s", "samp",
		"small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr", "caption",
		"col", "colgroup", "table", "tbody", "td", "tfoot", "th", "thead", "tr"
	],
	disallowedTagsMode: 'discard',
	allowedAttributes: {
		a: ['name', 'target'],
	},
	selfClosing: ['img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],
	allowedSchemes: ['http', 'https'],
	allowedSchemesByTag: {},
	allowedSchemesAppliedToAttributes: ['src', 'cite'],
	allowProtocolRelative: true,
	enforceHtmlBoundary: false
};

async function sendBackScrape(url, res) {
	let scrape = "";
	const prefix0 = 'http://';
	const prefix1 = 'https://';
	if (url.substr(0, prefix0.length) !== prefix0 &&
		url.substr(0, prefix1.length) !== prefix1) {
		url = prefix0 + url;
	}
	try {
		const response = await fetch(url);
		scrape = await response.text();
		scrape = sanitizeHtml(scrape, SANITIZE_OPTIONS);
		scrape = htmlToText.convert(scrape, { wordwrap: false });
		scrape = scrape.replace(/(\r\n|\n|\r)/gm, "");
		res.send({ scrape: scrape });
	} catch (e) {
		console.warn(e);
	}
}

// define a route - what happens when people visit /
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/public/html/index.html');
});

app.post('/scrape', function (req, res) {
	const targetUrl = req.body.target;
	console.log("scrape request received for: " + targetUrl);
	sendBackScrape(targetUrl, res);
});

httpServer.listen(PORT, () => {
	console.log('listening on :' + PORT);
});
