// let data = new URLSearchParams();
// data.append(`target`, `nytimes.com`);

let app = Vue.createApp({
    data: function() {
        return {
            url: 'nytimes.com',
        };
    },
    methods: {
        sendInput() {
            const scrapeUrl = '/scrape';
            const targetUrl = this.url;
            const data = JSON.stringify({"target": targetUrl});
            const options = {
                method: `POST`,
                body: data,
                headers:{          
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            };
            fetch(scrapeUrl, options)
                .then(data => {
                    if (!data.ok) {
                        throw data;
                    }
                    // document.body.innerHTML = ""; // clear doc
                    return data.text();
                }).then(data => {
                    const startStr = JSON.parse(data).scrape;
                    if (startStr.length > 0) {
                        sim.init(startStr);
                        console.log(startStr);
						document.getElementById("form").style.display = 'none';
                    } else {
                        console.error("string is blank");
                    }
                }).catch(error => {
                    console.error(error);
                }
            );
        }
    }
    
});
app.mount('#app');

let sim = new Simulation();

function sendInput() {
    
}