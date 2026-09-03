import { getMessagesHtml, getMessagesText, logMessage } from './log';

const WIKI_HEALTH_KEY = 'WIKI_FETCH_HEALTH';

async function updateWikiHealth(env, outcome, sendEmail, now = Date.now()) {
	if (!outcome || typeof outcome.healthy !== 'boolean') return;

	const stored = await env.CDOWN_KV.get(WIKI_HEALTH_KEY);
	let previous;
	try {
		previous = stored ? JSON.parse(stored) : null;
	} catch (error) {
		logMessage(`Wiki health state was invalid and will be replaced: ${error.message}`);
		previous = null;
	}

	if (!outcome.healthy) {
		const reason = outcome.reason || 'unknown error';
		const firstFailureAt = previous?.healthy === false ? previous.firstFailureAt : now;
		const consecutiveFailures = previous?.healthy === false ? (previous.consecutiveFailures || 1) + 1 : 1;
		const state = { healthy: false, firstFailureAt, lastFailureAt: now, consecutiveFailures, reason };

		if (!previous || previous.healthy !== false) {
			logMessage(`Wiki fetch outage detected: ${reason}`);
			await sendEmail(env, 'Countdown alert: wiki fetches are failing', getMessagesText(), getMessagesHtml());
		} else {
			logMessage(`Wiki fetch still unavailable (${consecutiveFailures} consecutive runs): ${reason}`);
		}
		await env.CDOWN_KV.put(WIKI_HEALTH_KEY, JSON.stringify(state));
		return;
	}

	if (previous?.healthy === true) return;

	if (previous?.healthy === false) {
		const outageMs = now - previous.firstFailureAt;
		const durationMinutes = Math.max(1, Math.round(outageMs / 60000));
		logMessage(
			`Wiki fetches recovered after about ${durationMinutes} minute(s) and ${previous.consecutiveFailures || 1} failed run(s). Last error: ${previous.reason}`,
		);
		await sendEmail(env, 'Countdown recovered: wiki fetches work again', getMessagesText(), getMessagesHtml());
	}
	await env.CDOWN_KV.put(WIKI_HEALTH_KEY, JSON.stringify({ healthy: true, lastSuccessAt: now }));
}

export { updateWikiHealth, WIKI_HEALTH_KEY };
