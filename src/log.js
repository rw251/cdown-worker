let messages = [];

const initLog = () => (messages = []);
const logMessage = (msg) => messages.push(msg);

const getMessages = (separator = ', ') => messages.join(separator);

const thereAreMessagesToBeLogged = () => messages.length > 0;

export { initLog, logMessage, getMessages, thereAreMessagesToBeLogged };
