const WebSocket = require("ws");
const express = require("express");

const startHTTPServer = require("./http_api.js");
const startWebsocketServer = require("./websocket_api.js");

const websocket_port = 443;
const http_port = 80;

// Start the websocket API
const wss = new WebSocket.Server({port: websocket_port});
startWebsocketServer(wss);
// Start the HTTP API and supply wss for message broadcasting
const app = express();
startHTTPServer(app, http_port, wss);