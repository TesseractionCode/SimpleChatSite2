const express = require("express");
const rateLimit = require('express-rate-limit')
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
        res.sendFile("views/index.html", {root: __dirname});
    });

    // Give a set of message objects around a message with a given ID
    const messageSetLimiter = rateLimit({
        windowMs: 3 * 1000, // 3 seconds
        max: 15, // 15 every 3 seconds
        message:
            'Messages are being requested too quickly.'
    });
    app.get("/message-set/:center_msg_index/:target_count", messageSetLimiter, (req, res) => {
        const SET_LENGTH_LIMIT = 250;
        const center_msg_index = Number.parseInt(req.params.center_msg_index);
        const target_count = Number.parseInt(req.params.target_count);

        // Limit the number of messages that can be requested
        if (target_count > SET_LENGTH_LIMIT) {
            res.status(413).send(`Could not fetch a message set of length 
            ${target_count}. Try something <= ${SET_LENGTH_LIMIT}.`);
            return;
        }
        
        const clamp = (number, min, max) =>
        Math.max(min, Math.min(number, max));
        const msg_count = message_data.getMessageCountSync();
        // Get the indices corresponding to the first and last message in the retrieved message set.
        const start_idx = clamp(center_msg_index - Math.round(target_count/2), 0, msg_count-1);
        const end_idx = clamp(center_msg_index + Math.round(target_count/2), 0, msg_count-1);
        let msg_set;
        if (end_idx - start_idx === 0) {
            msg_set = [];
        } else {
            msg_set = message_data.getMessagesInRangeSync(start_idx, end_idx);
        }
        res.send(JSON.stringify({
            message_set: msg_set,
            set_count: msg_set.length
        }));
    });

    // Get the total amount of messages
    const messageCountLimiter = rateLimit({
        windowMs: 3 * 1000, // 3 seconds
        max: 15, // 15 every 3 seconds
        message:
            'The message count is being requested too quickly.'
    });
    app.get("/message-count", messageCountLimiter, (req, res) => {
        const msg_count = message_data.getMessageCountSync();
        res.send({message_count: msg_count});
    });

    // Accept messages submitted from clients with a rate limit
    const messageLimiter = rateLimit({
        windowMs: 3 * 1000, // 3 seconds
        max: 15, // 15 every 3 seconds
        message:
            'Too many messages at once. Please send them slower.'
    });
    app.post("/message", messageLimiter, (req, res) => {
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
    // Listen to all HTTP requests and respond accordingly
    handleHTTPSRequests(app, wss);
    app.listen(port);
};

module.exports = startHTTPServer;