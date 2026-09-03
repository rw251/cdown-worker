import { episodeDateForState } from '../src/episodeSchedule.js';

describe('episode schedule state', () => {
	test('stores the parsed episode date using the existing 16:00 convention', () => {
		const parsedEpisodeDate = new Date('2026-08-21T02:00:00.000Z');

		expect(episodeDateForState(parsedEpisodeDate).toISOString()).toBe('2026-08-21T16:00:00.000Z');
	});

	test('rejects an invalid parsed date rather than corrupting KV state', () => {
		expect(() => episodeDateForState(new Date('invalid'))).toThrow('Cannot store invalid episode date');
	});
});
