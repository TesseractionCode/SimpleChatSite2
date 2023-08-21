// When a client connects to the WebSocket
function handleClientConnect(wss, client) {
    console.log("Client Connected")
}

// When a client sends a message via the WebSocket
function handleClientMessage(wss, client, data, is_binary) {
    console.log(`Message from client: "${data}"`)
}

// When a client disconnects from the WebSocket
function handleClientDisconnect(wss, client, code, reason) {
    console.log("Client Disconnected")
}

const startWebsocketServer = (wss) => {
    

    wss.on("connection", (client, req) => {
        
        handleClientConnect(wss, client);
        
        client.on("message", (data, is_binary) => {
            handleClientMessage(wss, client, data, is_binary);
        });

        client.on("close", (code, reason) => {
            handleClientDisconnect(wss, client, code, reason); 
        });
    });
}


module.exports = startWebsocketServer;
