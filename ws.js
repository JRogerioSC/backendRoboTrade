const WebSocket = require('ws');

let wss;

// cria websocket ligado ao servidor HTTP
function createWSS(server) {

    wss = new WebSocket.Server({
        server
    });

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
}

// broadcast global
function broadcast(data) {

    if (!wss) return;

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
    broadcast,
    createWSS
};