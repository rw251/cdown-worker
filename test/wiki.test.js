import { jest } from '@jest/globals';
import { fetchEpisodeWikitext, USER_AGENT } from '../src/wiki.js';

describe('wiki client', () => {
	test('reads revision source through the MediaWiki API', async () => {
		const fetchImpl = jest.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					query: { pages: [{ revisions: [{ slots: { main: { content: 'episode source' } } }] }] },
				}),
				{ status: 200, headers: { 'content-type': 'application/json' } },
			),
		);

		await expect(fetchEpisodeWikitext(6803, { fetchImpl })).resolves.toEqual({
			status: 'ok',
			httpStatus: 200,
			data: 'episode source',
		});

		const [url, options] = fetchImpl.mock.calls[0];
		expect(url).toContain('/api.php?');
		expect(url).toContain('maxlag=5');
		expect(url).toContain('titles=Episode_6803');
		expect(options.headers['User-Agent']).toBe(USER_AGENT);
	});

	test('classifies a missing page separately from an outage', async () => {
		const fetchImpl = jest
			.fn()
			.mockResolvedValue(new Response(JSON.stringify({ query: { pages: [{ missing: true }] } }), { status: 200 }));

		await expect(fetchEpisodeWikitext(9999, { fetchImpl })).resolves.toMatchObject({
			status: 'no-data',
			reason: 'page does not exist',
		});
	});

	test('retains HTTP details for blocks and rate limits', async () => {
		const fetchImpl = jest.fn().mockResolvedValue(
			new Response('Forbidden', {
				status: 403,
				statusText: 'Forbidden',
				headers: { 'retry-after': '120' },
			}),
		);

		await expect(fetchEpisodeWikitext(6803, { fetchImpl })).resolves.toEqual({
			status: 'unavailable',
			httpStatus: 403,
			retryAfter: '120',
			reason: 'HTTP 403 Forbidden',
		});
	});

	test('reports MediaWiki maxlag errors as temporary unavailability', async () => {
		const fetchImpl = jest.fn().mockResolvedValue(
			new Response(JSON.stringify({ error: { code: 'maxlag', info: 'Waiting for replication' } }), { status: 200 }),
		);

		await expect(fetchEpisodeWikitext(6803, { fetchImpl })).resolves.toMatchObject({
			status: 'unavailable',
			reason: 'maxlag: Waiting for replication',
		});
	});
});
