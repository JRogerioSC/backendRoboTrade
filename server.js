require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');

require('./bot');

const { broadcast, createWSS } = require('./ws');

const app = express();

app.use(cors());
app.use(express.json());

let botStatus = "OFF";

// ======================
// HTTP SERVER
// ======================

const server = http.createServer(app);

// inicia websocket
createWSS(server);

// ======================
// START BOT
// ======================

app.post('/start', (req, res) => {

    botStatus = "ON";

    broadcast({
        status: "ON"
    });

    console.log("BOT LIGADO");

    res.json({
        ok: true,
        status: botStatus
    });
});

// ======================
// STOP BOT
// ======================

app.post('/stop', (req, res) => {

    botStatus = "OFF";

    broadcast({
        status: "OFF"
    });

    console.log("BOT DESLIGADO");

    res.json({
        ok: true,
        status: botStatus
    });
});

// ======================
// STATUS
// ======================

app.get('/status', (req, res) => {

    res.json({
        status: botStatus
    });
});

// ======================
// SERVER
// ======================

server.listen(3001, () => {

    console.log("API ON 3001");
    console.log("WS ON 3001");
});