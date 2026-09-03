import { jest } from '@jest/globals';
import { initLog } from '../src/log.js';
import { updateWikiHealth, WIKI_HEALTH_KEY } from '../src/wikiHealth.js';

function makeEnv(initialState = null) {
	let state = initialState;
	return {
		CDOWN_KV: {
			get: jest.fn(async () => state),
			put: jest.fn(async (key, value) => {
				expect(key).toBe(WIKI_HEALTH_KEY);
				state = value;
			}),
		},
		readState: () => JSON.parse(state),
	};
}

describe('wiki health notifications', () => {
	beforeEach(() => initLog());

	test('sends one outage email and suppresses repeats', async () => {
		const env = makeEnv();
		const send = jest.fn().mockResolvedValue('sent');

		await updateWikiHealth(env, { healthy: false, reason: 'HTTP 403 Forbidden' }, send, 1000);
		await updateWikiHealth(env, { healthy: false, reason: 'HTTP 403 Forbidden' }, send, 2000);

		expect(send).toHaveBeenCalledTimes(1);
		expect(send.mock.calls[0][1]).toContain('wiki fetches are failing');
		expect(env.readState()).toMatchObject({ healthy: false, consecutiveFailures: 2, firstFailureAt: 1000 });
	});

	test('emails once when a recorded outage recovers', async () => {
		const env = makeEnv(
			JSON.stringify({ healthy: false, firstFailureAt: 1000, lastFailureAt: 2000, consecutiveFailures: 2, reason: 'HTTP 403' }),
		);
		const send = jest.fn().mockResolvedValue('sent');

		await updateWikiHealth(env, { healthy: true }, send, 121000);

		expect(send).toHaveBeenCalledTimes(1);
		expect(send.mock.calls[0][1]).toContain('work again');
		expect(env.readState()).toEqual({ healthy: true, lastSuccessAt: 121000 });
	});

	test('does not email for an initially healthy run', async () => {
		const env = makeEnv();
		const send = jest.fn();

		await updateWikiHealth(env, { healthy: true }, send, 1000);

		expect(send).not.toHaveBeenCalled();
	});
});
