const express = require("express");
const ejs = require("ejs");
const cookieParser = require("cookie-parser");
const message_data = require("./message_data.js");

/**@returns whether the username a message_text are both in valid format or not.*/
function isMessageAndUsernameValid(username, message_text) {
    return (/\S/.test(username)) && (/\S/.test(message_text));
}

/**Create a valid-format message object, save it to the server's
 * message logs, then braodcast it to all connected users.
*/
function createAndSubmitMessage(username, message_text, wss) {
    message_data.getMessageCount().then(count => {
        const msg_object = {
            index: count,
            username: username,
            message_text: message_text
        };
        // Add the message to the server message data
        message_data.appendMessage(msg_object).then(() => {
            // Broadcast the message to all connected users.
            wss.clients.forEach(client => {
                client.send(JSON.stringify(msg_object));
            });
        });
    });
}

function handleHTTPSRequests(app, wss) {
    // Send the website on intial connection
    app.get("/", (req, res) => {
        //res.sendFile("views/index.html", {root: __dirname});
        res.render("index", {
            message_data: message_data
        });
    });
    // Accept messages submitted from clients
    app.post("/message", (req, res) => {
        const username = req.body.username.trim();
        const message_text = req.body.message_text.trim();
        // Invalidate the username if it does not fit minimum message standards
        if (!isMessageAndUsernameValid(username, message_text)) {
            res.send("Invalid-Message");
            return;
        }
        // Create a cookie to save the user's username for 14 days.
        res.cookie("username", username, {
            maxAge: 14*24*60*60*1000
        });
        // Create the message and formally submit it
        createAndSubmitMessage(username, message_text, wss);
        // Validate the message
        res.send("Valid-Message");
    });
}

const startHTTPServer = (app, port, wss) => {
    // Setup and define settings for the HTTP server
    app.use(express.static("./public"));
    app.use(cookieParser());
    app.use(express.json());
    app.set("view engine", "ejs");
    // Listen to all HTTP requests and respond accordingly
    handleHTTPSRequests(app, wss);
    app.listen(port);
};

module.exports = startHTTPServer;