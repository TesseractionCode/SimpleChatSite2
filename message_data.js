const fs = require("fs");

/**Synchronously returns an array of all of the message objects saved
 * in the messages file.
 */
function getMessagesSync() {
    const raw_data = fs.readFileSync("./messages.json")
    return JSON.parse(raw_data.toString());
}

/**Asynchronously returns an array of all of the message objects saved
 * in the messages file.
 */
async function getMessages() {
    return await getMessagesSync();
}

/**Synchronously sets JSON data inside of the message file to the
 * data supplied in the message_array param. The messages_array
 * should be a Javascript array of message objects.
*/
function setMessagesSync(messages_array) {
    fs.writeFileSync("./messages.json", JSON.stringify(messages_array));
}

/**Asynchronously sets JSON data inside of the message file to the
 * data supplied in the message_array param. The messages_array
 * should be a Javascript array of message objects.
*/
async function setMessages(messages_array) {
    return await setMessagesSync(messages_array);
}

/**Synchronously Append the given message object to the array of message objects
 * stored in the messages file.
*/
function appendMessageSync(message) {
    const messages = getMessagesSync();
    messages.push(message);
    setMessagesSync(messages);
}

/**Asynchronously Append the given message object to the array of message objects
 * stored in the messages file.
*/
async function appendMessage(message) {
    return await appendMessageSync(message);
}

/**Synchronously returns an array of message objects whose message-indices
 * belong in the given index range. The first message has index 0, second
 * has index 1, and so on. getMessagesInRangeSync(9, 19) would (inclusively)
 * return an array of all of the messages spanning from the 10th message all
 * the way to the 20th message ever sent.
 * @returns null if the range is invalid, otherwise an array of message objects
*/
function getMessagesInRangeSync(start_index, end_index) {
    const all_messages = getMessagesSync();
    const message_cnt = all_messages.length;
    if ((end_index < start_index) || (start_index < 0) || (end_index < 0) || (start_index >= message_cnt) || (end_index >= message_cnt)) {
        return null;
    }
    return all_messages.slice(start_index, end_index+1);
}

/**Asynchronously returns an array of message objects whose message-indices
 * belong in the given index range. The first message has index 0, second
 * has index 1, and so on. getMessagesInRangeSync(9, 19) would (inclusively)
 * return an array of all of the messages spanning from the 10th message all
 * the way to the 20th message ever sent.
 * @returns null if the range is invalid, otherwise an array of message objects
*/
async function getMessagesInRange(start_index, end_index) {
    return await getMessagesInRangeSync(start_index, end_index);
}

/**Synchronously get the total number of messages in the messages file.*/
function getMessageCountSync() {
    return getMessagesSync().length;
}

/**Asynchronously get the total number of messages in the messages file.*/
async function getMessageCount() {
    return await getMessageCountSync();
}

module.exports = {
    getMessagesSync,
    getMessages,
    setMessagesSync,
    setMessages,
    appendMessageSync,
    appendMessage,
    getMessagesInRangeSync,
    getMessagesInRange,
    getMessageCountSync,
    getMessageCount
};