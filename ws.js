const WebSocket = require('ws');

const wss = new WebSocket.Server({
    port: 8080
});

// ======================
// CONNECTION
// ======================

wss.on('connection', (ws) => {

    console.log('Frontend conectado');

    ws.send(JSON.stringify({
        status: "CONNECTED"
    }));

    ws.on('close', () => {
        console.log('Frontend desconectou');
    });

    ws.on('error', (err) => {
        console.log('WS CLIENT ERROR:', err.message);
    });
});

// ======================
// BROADCAST
// ======================

function broadcast(data) {

    const message = JSON.stringify(data);

    wss.clients.forEach(client => {

        try {

            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }

        } catch (err) {

            console.log('WS ERROR:', err.message);
        }
    });
}

module.exports = {
    broadcast
};