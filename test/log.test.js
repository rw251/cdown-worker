import { getMessages, getMessagesText, getMessagesHtml, initLog, logMessage, thereAreMessagesToBeLogged } from '../src/log.js';

describe('log utils', () => {
	beforeEach(() => {
		initLog();
	});

	test('records and formats messages', () => {
		expect(getMessages()).toBe('');
		expect(thereAreMessagesToBeLogged()).toBe(false);

		logMessage('alpha');
		logMessage('beta');

		expect(thereAreMessagesToBeLogged()).toBe(true);
		expect(getMessages()).toBe('alpha, beta');
		expect(getMessages(' | ')).toBe('alpha | beta');
	});

	test('getMessagesText returns newline-separated messages with timestamps', () => {
		logMessage('first');
		logMessage('second');

		const text = getMessagesText();
		expect(text).toMatch(/\[\d{2}:\d{2}:\d{2}\] first/);
		expect(text).toMatch(/\[\d{2}:\d{2}:\d{2}\] second/);
		expect(text).toContain('\n');
	});

	test('getMessagesHtml returns HTML table with timestamps', () => {
		logMessage('hello');

		const html = getMessagesHtml();
		expect(html).toContain('<table');
		expect(html).toContain('<tr>');
		expect(html).toContain('hello');
	});

	test('getMessagesHtml escapes HTML entities', () => {
		logMessage('<script>alert("xss")</script>');

		const html = getMessagesHtml();
		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
	});
});
