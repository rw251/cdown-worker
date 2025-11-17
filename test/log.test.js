import { getMessages, initLog, logMessage, thereAreMessagesToBeLogged } from '../src/log.js';

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
});
