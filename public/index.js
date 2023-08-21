const server_ip = "127.0.0.1";
const websocket_port = 443;
const http_port = 80;
const ws = new WebSocket(`ws://${server_ip}:${websocket_port}`);

const message_output = document.querySelector("#message-output");
const username_input = document.querySelector("#username-input");
const message_input = document.querySelector("#message-input");
const send_button = document.querySelector("#send-button");

message_output.scrollTo(0, message_output.scrollHeight);

ws.onmessage = (msg) => {
    const msg_obj = JSON.parse(msg.data);
    message_output.innerHTML += `${msg_obj.username}: ${msg_obj.message_text}<br/>`;
    message_output.scrollTo(0, message_output.scrollHeight);
};

/**Makes an HTTP request to the server's HTTP API with the
 * using the given options.
 * @param api_directory examples: "submit_message" or "data/get_user" or ""
 * @param http_options optional if no options are necessary (like if you're
 * making a GET request)
 * @returns An HTTP fetch promise.
*/
function makeHTTPRequest(api_directory, http_options) {
    if ((api_directory.length > 0) && (api_directory[0] != "/")) {
        api_directory = "/" + api_directory;
    }
    const uri = `http://${server_ip}:${http_port}${api_directory}`;
    if (http_options) {
        return fetch(uri, http_options);
    } else {
        return fetch(uri);
    }
}

/**Submits a message to the server.
 * @returns An HTTP fetch promise.
*/
function submitMessage(username, message_text) {
    const data = {username: username, message_text: message_text};
    const http_options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    };
    return makeHTTPRequest("message", http_options);
}

/**Verify the message and username fields and submit to server if valid.
 * Also clears the message input field if successfull.
 * @returns A promise that results in true if successfull and false if not.
*/
function verifyAndSubmitMessageFields() {
    const username = username_input.value;
    const message_text = message_input.value;
    // Try to submit the message to the server.
    return new Promise((resolve, reject) => {
        submitMessage(username, message_text).then(res => {
            if (res.status === 429) {
                // Too many requests
                message_output.innerHTML += `[WARNING]: Too fast! Slow Down!<br/>`;
                message_output.scrollTo(0, message_output.scrollHeight);
                resolve(false);
                return;
            }
            res.text().then(res_msg => {
                if (res_msg === "Valid-Message") {
                    message_input.value = "";
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    });
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function trySetUsernameFromCookie() {
    const cookie_username = getCookie("username");
    if (cookie_username) {
        username_input.value = cookie_username;
    }
}

// Set the username field if the user has a cookie for it
trySetUsernameFromCookie();

// Submit messages based on appropriate inputs
send_button.addEventListener("click", () => {
    verifyAndSubmitMessageFields()
});
message_input.addEventListener("keypress", ev => {
    if ((ev.key === "Enter") && (!ev.shiftKey)) {
        ev.preventDefault();
        verifyAndSubmitMessageFields();
    }
});
