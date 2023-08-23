const server_ip = "127.0.0.1";
const websocket_port = 443;
const http_port = 80;
const ws = new WebSocket(`ws://${server_ip}:${websocket_port}`);

const message_output = document.querySelector("#message-output");
const username_input = document.querySelector("#username-input");
const message_input = document.querySelector("#message-input");
const send_button = document.querySelector("#send-button");

/**Stores a list of messages that are currently loaded into the client*/
const loaded_messages = [];
/**Number of messages to load at a time.*/
const LOAD_STEP_SIZE = 50;

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

/**Returns a list of message objects from the server that are positioned
 * around the index of the center_index given. Ex. a center_index of 10
 * and a num_messages of 5 will give messages with indices 3-7 (5 messages).
 * If messages above index 5 don't exist on the server, it would return only
 * 3 messages.
*/
async function getMessagesAroundIndex(center_index, num_messages) {
    const message_objs = (await ((await makeHTTPRequest(`message-set/${center_index}/${num_messages}`)).json())).message_set;
    return message_objs;
}

/**Get a set of the last messages that the server has on record and then load them.
 * The set count is determined by the server.
*/
async function loadLastMessages(num_messages) {
    const last_msg_idx = (await ((await makeHTTPRequest("message-count")).json())).message_count - 1;
    const last_messages = await getMessagesAroundIndex(last_msg_idx, num_messages*2);
    loadMessages(last_messages);
}

/**Render all client-loaded messages onto the message-output*/
function renderLoadedMessages(scroll_to_bottom=false) {
    message_output.innerHTML = "";
    loaded_messages.forEach(msg_obj => {
        message_output.innerHTML += `${msg_obj.username}: ${msg_obj.message_text}<br/><br/>`;
    });
    if (scroll_to_bottom) message_output.scrollTo(0, message_output.scrollHeight);
}

/**Load a message object to client side (keeps track of messages sent to client) */
function loadMessage(msg_obj, push_to_beginning=false) {
    if (push_to_beginning) {
        loaded_messages.unshift(msg_obj);
    } else {
        loaded_messages.push(msg_obj);
    }
}

/**Load an array of message objects to client side (keeps track of messages sent to client) */
function loadMessages(msg_objs, push_to_beginning=false) {
    if (push_to_beginning) {
        msg_objs = msg_objs.toReversed();
    }
    msg_objs.forEach(msg_obj => {
        loadMessage(msg_obj, push_to_beginning);
    });
}

// Load and render incoming messages
ws.onmessage = (msg) => {
    const msg_obj = JSON.parse(msg.data);
    loadMessage(msg_obj);
    renderLoadedMessages(scroll_to_bottom=true);
};

// Load more messages when the user scrolls to the top of the message output and then render them
message_output.addEventListener("scroll", async () => {
    if ((message_output.scrollTop !== 0) || (loaded_messages.length === 0)) return;
    const oldest_idx = loaded_messages[0].index;
    var old_messages = await getMessagesAroundIndex(oldest_idx - Math.round(LOAD_STEP_SIZE/2) + 1, LOAD_STEP_SIZE);
    
    // Get rid of old messages with an index equal to or above the oldest loaded one
    let overlapping_idx;
    old_messages.forEach((msg_obj, i) => {
        if (msg_obj.index === oldest_idx) {
            overlapping_idx = i;
        }
    });
    if (overlapping_idx != undefined) {
        old_messages = old_messages.slice(0, overlapping_idx);
    }

    loadMessages(old_messages, push_to_beginning=true);
    const old_scrollHeight = message_output.scrollHeight;
    renderLoadedMessages(scroll_to_bottom=false);
    const new_scrollHeight = message_output.scrollHeight;
    const output_growth = new_scrollHeight - old_scrollHeight;
    message_output.scrollTop += output_growth;
});

// Render the last messages that the server has record of
loadLastMessages(num_messages=LOAD_STEP_SIZE).then(() => {
    renderLoadedMessages(scroll_to_bottom=true);
});
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
