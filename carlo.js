const carlo = require('carlo');

(async () => {
    const app = await carlo.launch()

    // exit node on exit carlo app
    app.on('exit', () => process.exit())

    app.serveFolder(`${__dirname}/app`)

    await app.load('index.html')
})()
