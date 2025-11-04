import { sendEmail } from './email';
import { parseEpisode } from './episodeParsing';
import { initLog, getMessages, logMessage } from './log';

const SERIES_FILE = 'series.json';
const PLAYERS_FILE = 'players.json';

function getNextEpisodeDateAndTimeAndTime(date = new Date()) {
	// assume episodes are only on weekdays
	const dayOfWeek = date.getDay();
	let nextEpisodeGap = 1;
	if (dayOfWeek === 5) nextEpisodeGap = 3;
	if (dayOfWeek === 6) nextEpisodeGap = 2;
	const nextEpisodeDateAndTime = new Date(date);
	nextEpisodeDateAndTime.setDate(nextEpisodeDateAndTime.getDate() + nextEpisodeGap);
	nextEpisodeDateAndTime.setHours(16);
	return nextEpisodeDateAndTime;
}

let logFile;
async function getLog(env) {
	const logPromise = await env.CDOWN_BUCKET.get('LOG');
	const log = logPromise ? await logPromise.json() : [];
	return log;
}

async function log(env, msg) {
	if (!logFile) {
		logFile = await getLog(env);
	}
	logFile.push(msg);
}

async function writeLog(env) {
	await env.CDOWN_BUCKET.put('LOG', JSON.stringify(logFile));
}

async function internalGetEpisode({ episodeNumber, isUpdate = false }) {
	const apterousUrl = 'http://wiki.apterous.org/index.php';
	const html = await fetch(`${apterousUrl}?title=Episode_${episodeNumber}&action=edit`).then((resp) => resp.text());

	logMessage(`Retrieved episode ${episodeNumber} now trying to process.`);

	const textarea = html.match(/wpTextbox1[^>]+>([\s\S]+)<\/textarea>/);
	//bfalse; // $('#wpTextbox1').val();
	if (!textarea || !textarea.length || textarea.length < 2) {
		// Nothing on that page - do something
		// Write log and exit
		return { nodatayet: true };
	}
	const data = textarea[1];
	const episode = parseEpisode(data, episodeNumber, isUpdate);
	if (!episode) return { nodatayet: true };
	return { episode, data };
}

async function doPlayers(env, episode) {
	const playersData = await env.CDOWN_BUCKET.get(PLAYERS_FILE);
	const players = playersData ? await playersData.json() : { Barry_Wood: [8130, 8131] };

	if (!players[episode.p1.l]) {
		players[episode.p1.l] = [];
	}
	if (!players[episode.p2.l]) {
		players[episode.p2.l] = [];
	}
	players[episode.p1.l].push(episode.e);
	players[episode.p2.l].push(episode.e);
	players[episode.p1.l] = [...new Set(players[episode.p1.l])];
	players[episode.p2.l] = [...new Set(players[episode.p2.l])];

	return players;
}

async function doSeries(env, episode) {
	const allSeriesData = await env.CDOWN_BUCKET.get(SERIES_FILE);
	const thisSeriesFile = `series-${episode.s.l}.json`;
	const thisSeriesData = await env.CDOWN_BUCKET.get(thisSeriesFile);
	const thisSeries = thisSeriesData ? await thisSeriesData.json() : {};
	const series = allSeriesData ? await allSeriesData.json() : { Series_88: { a: '2023-06-30', b: '2023-10-20', c: 8051, d: 8131 } };

	Object.keys(series).forEach((key) => {
		series[key].a = new Date(series[key].a);
		series[key].b = new Date(series[key].b);
	});

	if (!series[episode.s.l]) {
		series[episode.s.l] = {
			a: episode.d,
			b: episode.d,
			c: episode.e,
			d: episode.e,
		};
	} else if (episode.d < series[episode.s.l].a) {
		if (episode.e <= series[episode.s.l].c) {
			// episode number before series start so ok
			series[episode.s.l].a = episode.d;
			series[episode.s.l].c = episode.e;
		} else {
			// not ok so let's fudge for now
			series[episode.s.l].a = episode.d;
		}
	} else if (episode.d > series[episode.s.l].b) {
		if (episode.e >= series[episode.s.l].d) {
			// episode number after series end so ok
			series[episode.s.l].b = episode.d;
			series[episode.s.l].d = episode.e;
		} else {
			// not ok so let's fudge for now
			series[episode.s.l].b = episode.d;
		}
	}

	thisSeries[episode.e] = { d: episode.d };

	await env.CDOWN_BUCKET.put(thisSeriesFile, JSON.stringify(thisSeries));

	Object.keys(series).forEach((s) => {
		series[s].a = series[s].a.toISOString().substr(0, 10);
		series[s].b = series[s].b.toISOString().substr(0, 10);
	});

	return series;
}

async function checkAndUpdatePreviousEpisodes(env, latestEpisodeNumber) {
	const updatedEpisodes = [];

	// Check previous 4 episodes
	const episodesToCheck = [latestEpisodeNumber - 1, latestEpisodeNumber - 2, latestEpisodeNumber - 3, latestEpisodeNumber - 4];

	for (const episodeNumber of episodesToCheck) {
		try {
			// Fetch the latest version from wiki
			const { episode: newEpisode, data: newData, nodatayet } = await internalGetEpisode({ episodeNumber, isUpdate: true });

			if (nodatayet) {
				logMessage(`Episode ${episodeNumber} not available for recheck (possibly pulled).`);
				continue;
			}

			// Get the existing stored version from R2
			const existingEpisodeData = await env.CDOWN_BUCKET.get(`${episodeNumber}.json`);

			if (!existingEpisodeData) {
				logMessage(`Episode ${episodeNumber} not found in storage, skipping recheck.`);
				continue;
			}

			const existingEpisode = await existingEpisodeData.json();

			// Compare the episodes (stringify for deep comparison)
			const existingStr = JSON.stringify(existingEpisode);
			const newStr = JSON.stringify(newEpisode);

			if (existingStr !== newStr) {
				logMessage(`Episode ${episodeNumber} has been updated on the wiki!`);

				// Update storage with new version
				await env.CDOWN_KV.put(episodeNumber, newData);
				await env.CDOWN_BUCKET.put(`${episodeNumber}.json`, JSON.stringify(newEpisode));

				// Update players and series data
				await doPlayers(env, newEpisode);
				await doSeries(env, newEpisode);

				updatedEpisodes.push({
					episodeNumber,
					changes: findChanges(existingEpisode, newEpisode),
				});
			} else {
				logMessage(`Episode ${episodeNumber} unchanged.`);
			}
		} catch (error) {
			logMessage(`Error checking episode ${episodeNumber}: ${error.message}`);
		}
	}

	return updatedEpisodes;
}

function findChanges(oldEpisode, newEpisode) {
	const changes = [];
	const keys = Object.keys(newEpisode);

	for (const key of keys) {
		const oldVal = JSON.stringify(oldEpisode[key]);
		const newVal = JSON.stringify(newEpisode[key]);
		if (oldVal !== newVal) {
			changes.push(`${key}: ${oldVal} -> ${newVal}`);
		}
	}

	return changes.join('; ');
}

const getNextEpisode = async (env) => {
	// Get most recent successful episode date
	const LAST_SUCCESSFUL_EPISODE_DATE = await env.CDOWN_KV.get('LAST_SUCCESSFUL_EPISODE_DATE');
	// Calculate next episode date and time to get
	const NEXT_EPISODE_TO_GET_DATE_AND_TIME = getNextEpisodeDateAndTimeAndTime(new Date(LAST_SUCCESSFUL_EPISODE_DATE));

	const NOW = new Date();
	const shouldGetNextEpisode = NOW > NEXT_EPISODE_TO_GET_DATE_AND_TIME;

	if (!shouldGetNextEpisode) {
		// Write log and exit
		await log(
			env,
			`${NOW}: Last success was on ${LAST_SUCCESSFUL_EPISODE_DATE}. Next episode check at ${NEXT_EPISODE_TO_GET_DATE_AND_TIME}. In the future so stopping.`
		);
		await writeLog(env);
		return false;
	}

	// Get most recent successful episode number
	const LAST_SUCCESSFUL_EPISODE_NUMBER = await env.CDOWN_KV.get('LAST_SUCCESSFUL_EPISODE_NUMBER');

	const episodeNumber = +LAST_SUCCESSFUL_EPISODE_NUMBER + 1;
	console.log(episodeNumber);

	const { episode, data, nodatayet } = await internalGetEpisode({ episodeNumber });

	if (nodatayet) {
		// Even if no new episode, check previous episodes for updates
		logMessage(`No new episode found (${episodeNumber}), but checking previous episodes for updates...`);
		const updatedEpisodes = await checkAndUpdatePreviousEpisodes(env, episodeNumber - 1);

		if (updatedEpisodes.length > 0) {
			logMessage(`Found ${updatedEpisodes.length} updated episode(s) in previous episodes.`);
			return { updatedEpisodes, noNewEpisode: true };
		}
		return false;
	}

	// New episode found - process it
	const players = await doPlayers(env, episode);
	const series = await doSeries(env, episode);

	await env.CDOWN_KV.put(episodeNumber, data);
	await env.CDOWN_BUCKET.put(`${episodeNumber}.json`, JSON.stringify(episode));
	await env.CDOWN_KV.put('LAST_SUCCESSFUL_EPISODE_DATE', NEXT_EPISODE_TO_GET_DATE_AND_TIME.toISOString());
	await env.CDOWN_KV.put('LAST_SUCCESSFUL_EPISODE_NUMBER', episodeNumber);
	await env.CDOWN_BUCKET.put(PLAYERS_FILE, JSON.stringify(players));
	await env.CDOWN_BUCKET.put(SERIES_FILE, JSON.stringify(series));

	// Also check previous episodes for updates
	logMessage(`New episode ${episodeNumber} processed. Now checking previous episodes for updates...`);
	const updatedEpisodes = await checkAndUpdatePreviousEpisodes(env, episodeNumber - 1);

	if (updatedEpisodes.length > 0) {
		logMessage(`Found ${updatedEpisodes.length} updated episode(s) in previous episodes.`);
		return { data, updatedEpisodes };
	}

	return { data };
};

export default {
	// Useful for testing without waiting for cron job
	// async fetch(request, env, ctx) {
	// 	try {
	// 		await notify(env);
	// 		return new Response(JSON.stringify({ success: true }));
	// 	} catch (err) {
	// 		return new Response(err.message);
	// 	}
	// },
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.

	async scheduled(event, env, ctx) {
		let result;
		try {
			result = await getNextEpisode(env);
			if (!result) return;
		} catch (e) {
			await sendEmail(env, 'Countdown errors', e, e);
			return;
		}

		// Prepare email subject based on what happened
		let subject = 'Countdown log';
		if (result.noNewEpisode && result.updatedEpisodes?.length > 0) {
			subject = `Countdown: ${result.updatedEpisodes.length} episode(s) updated`;
		} else if (result.updatedEpisodes?.length > 0) {
			subject = `Countdown: New episode + ${result.updatedEpisodes.length} update(s)`;
		} else if (!result.noNewEpisode) {
			subject = 'Countdown: New episode';
		}

		logMessage('Seems to have worked!');

		// Add summary of updates to message
		if (result.updatedEpisodes?.length > 0) {
			logMessage('\n=== Updated Episodes ===');
			for (const update of result.updatedEpisodes) {
				logMessage(`Episode ${update.episodeNumber}: ${update.changes}`);
			}
		}

		await sendEmail(env, subject, getMessages(), getMessages());
	},

	async fetch(request, env) {
		// await env.CDOWN_KV.put('LAST_SUCCESSFUL_EPISODE_NUMBER', '8157');
		// return;
		let result = await getNextEpisode(env);
		console.log(getMessages());
		return;
		// await env.CDOWN_KV.put('LAST_SUCCESSFUL_EPISODE_NUMBER', '8157');
		// return;
		initLog();
		if (request.url.indexOf('init') > -1) {
			const date = new Date();
			date.setDate(date.getDate() - 30);
			await env.CDOWN_KV.put('LAST_SUCCESSFUL_EPISODE_NUMBER', 8080);
			return new Response(JSON.stringify({ date }), {
				headers: {
					'content-type': 'application/json;charset=UTF-8',
				},
			});
		} else if (request.url.indexOf('log') > -1) {
			const log = await env.CDOWN_BUCKET.get('LOG').then((x) => x.json());
			return new Response(JSON.stringify(log), {
				headers: {
					'content-type': 'application/json;charset=UTF-8',
				},
			});
		} else if (request.url.indexOf('kv') > -1) {
			const LAST_SUCCESSFUL_EPISODE_DATE = await env.CDOWN_KV.get('LAST_SUCCESSFUL_EPISODE_DATE');
			const LAST_SUCCESSFUL_EPISODE_NUMBER = await env.CDOWN_KV.get('LAST_SUCCESSFUL_EPISODE_NUMBER');
			return new Response(JSON.stringify({ LAST_SUCCESSFUL_EPISODE_DATE, LAST_SUCCESSFUL_EPISODE_NUMBER }), {
				headers: {
					'content-type': 'application/json;charset=UTF-8',
				},
			});
		} else if (request.url.indexOf('list') > -1) {
			const list = await env.CDOWN_BUCKET.list();
			return new Response(JSON.stringify({ list }), {
				headers: {
					'content-type': 'application/json;charset=UTF-8',
				},
			});
		} else if (request.url.indexOf('series') > -1) {
			const series = await env.CDOWN_BUCKET.get(SERIES_FILE).then((x) => x.json());
			return new Response(JSON.stringify(series), {
				headers: {
					'content-type': 'application/json;charset=UTF-8',
				},
			});
		} else if (request.url.indexOf('players') > -1) {
			const players = await env.CDOWN_BUCKET.get(PLAYERS_FILE).then((x) => x.json());
			return new Response(JSON.stringify(players), {
				headers: {
					'content-type': 'application/json;charset=UTF-8',
				},
			});
		} else if (request.url.indexOf('get') > -1) {
			const ep = +request.url.split('/get')[1].replace(/[^0-9]/g, '');
			const { episode, data, nodatayet } = await internalGetEpisode({ episodeNumber: ep });

			if (nodatayet) {
				return new Response(JSON.stringify({ message: 'Episode not retrieved. Likely pulled from broadcast.' }), {
					headers: {
						'content-type': 'application/json;charset=UTF-8',
					},
				});
			}

			const players = await doPlayers(env, episode);
			const series = await doSeries(env, episode);

			await env.CDOWN_KV.put(ep, data);
			await env.CDOWN_BUCKET.put(`${ep}.json`, JSON.stringify(episode));
			await env.CDOWN_BUCKET.put(PLAYERS_FILE, JSON.stringify(players));
			await env.CDOWN_BUCKET.put(SERIES_FILE, JSON.stringify(series));

			// Also check previous episodes for updates
			logMessage(`Episode ${ep} processed. Now checking previous episodes for updates...`);
			const updatedEpisodes = await checkAndUpdatePreviousEpisodes(env, ep - 1);

			const messages = getMessages();
			return new Response(JSON.stringify({ messages, episode, data, updatedEpisodes }), {
				headers: {
					'content-type': 'application/json;charset=UTF-8',
				},
			});
		} else {
			// let data;
			// try {
			// 	data = await getNextEpisode(env);
			// 	if (!data) return;
			// } catch (e) {
			// 	await sendEmail(env, 'Countdown errors', e, e);
			// 	return new Response(JSON.stringify({ error: true }), {
			// 		headers: {
			// 			'content-type': 'application/json;charset=UTF-8',
			// 		},
			// 	});
			// }
			// logMessage('Seems to have worked!');
			// await sendEmail(env, 'Countdown log', getMessages(), getMessages());

			return new Response('{}', {
				headers: {
					'content-type': 'application/json;charset=UTF-8',
				},
			});
		}
	},
};
