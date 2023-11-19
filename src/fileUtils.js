import { logMessage } from './log';

const dirFromNumber = (episodeNumber) =>
	join(
		__dirname,
		'..',
		'..',
		'..',
		'public_html',
		'cdown',
		'episodes',
		`${episodeNumber - (episodeNumber % 1000)}`,
		`${episodeNumber - (episodeNumber % 100)}`,
		`${episodeNumber - (episodeNumber % 10)}`
	);
const fileFromNumber = (episodeNumber) =>
	join(
		__dirname,
		'..',
		'..',
		'..',
		'public_html',
		'cdown',
		'episodes',
		`${episodeNumber - (episodeNumber % 1000)}`,
		`${episodeNumber - (episodeNumber % 100)}`,
		`${episodeNumber - (episodeNumber % 10)}`,
		`${episodeNumber}.txt`
	);
const removeFiles = (filenames) => {
	logMessage(`Removing the following as they error'd: ${filenames.join(', ')}`);
	filenames.forEach(unlinkSync);
};

export { dirFromNumber, fileFromNumber, removeFiles };
