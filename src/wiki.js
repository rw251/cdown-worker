const WIKI_API_URL = 'https://wiki.apterous.org/api.php';
const USER_AGENT = 'cdown-worker/2.0 (Countdown episode archive; contact: cdown@rw251.com)';

function describeApiError(error) {
	if (!error) return 'unknown MediaWiki API error';
	return `${error.code || 'unknown'}: ${error.info || 'no details supplied'}`;
}

async function fetchEpisodeWikitext(episodeNumber, { fetchImpl = fetch, timeoutMs = 10000 } = {}) {
	const url = new URL(WIKI_API_URL);
	url.search = new URLSearchParams({
		action: 'query',
		prop: 'revisions',
		rvprop: 'content',
		rvslots: 'main',
		titles: `Episode_${episodeNumber}`,
		format: 'json',
		formatversion: '2',
		maxlag: '5',
	}).toString();

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	let response;

	try {
		response = await fetchImpl(url.toString(), {
			signal: controller.signal,
			headers: {
				Accept: 'application/json',
				'User-Agent': USER_AGENT,
			},
		});
	} catch (error) {
		const isTimeout = error?.name === 'AbortError';
		return {
			status: 'unavailable',
			reason: isTimeout ? `request timed out after ${timeoutMs}ms` : `network error: ${error?.message || String(error)}`,
		};
	} finally {
		clearTimeout(timeout);
	}

	if (!response.ok) {
		return {
			status: 'unavailable',
			httpStatus: response.status,
			retryAfter: response.headers.get('retry-after'),
			reason: `HTTP ${response.status} ${response.statusText}`.trim(),
		};
	}

	let payload;
	try {
		payload = await response.json();
	} catch (error) {
		return { status: 'unavailable', httpStatus: response.status, reason: `invalid JSON: ${error.message}` };
	}

	if (payload.error) {
		return { status: 'unavailable', httpStatus: response.status, reason: describeApiError(payload.error) };
	}

	const page = payload.query?.pages?.[0];
	if (!page || page.missing === true) {
		return { status: 'no-data', httpStatus: response.status, reason: 'page does not exist' };
	}

	const revision = page.revisions?.[0];
	const content = revision?.slots?.main?.content ?? revision?.slots?.main?.['*'] ?? revision?.['*'];
	if (typeof content !== 'string') {
		return { status: 'no-data', httpStatus: response.status, reason: 'page has no readable revision content' };
	}

	return { status: 'ok', httpStatus: response.status, data: content };
}

export { fetchEpisodeWikitext, USER_AGENT, WIKI_API_URL };
