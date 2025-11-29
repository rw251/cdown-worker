let messages = [];

const initLog = () => (messages = []);
const logMessage = (msg) => messages.push({ time: new Date().toISOString(), msg });

// Plain text format with line breaks
const getMessagesText = () => messages.map((m) => `[${m.time.substr(11, 8)}] ${m.msg}`).join('\n');

// HTML format with styling
const getMessagesHtml = () => {
	if (messages.length === 0) return '<p>No log messages.</p>';
	const rows = messages
		.map(
			(m) =>
				`<tr><td style="color:#666;font-family:monospace;padding-right:12px;white-space:nowrap;vertical-align:top;">${m.time.substr(11, 8)}</td><td style="padding:2px 0;">${escapeHtml(m.msg)}</td></tr>`
		)
		.join('');
	return `<table style="border-collapse:collapse;font-size:14px;">${rows}</table>`;
};

// Legacy support - returns comma-separated messages
const getMessages = (separator = ', ') => messages.map((m) => m.msg).join(separator);

const thereAreMessagesToBeLogged = () => messages.length > 0;

const escapeHtml = (str) =>
	String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

export { initLog, logMessage, getMessages, getMessagesText, getMessagesHtml, thereAreMessagesToBeLogged };
