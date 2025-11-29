import { parseEpisode } from '../src/episodeParsing.js';
import { initLog } from '../src/log.js';

const lettersRound = (index, selection, p1, p2, dic, next = '', next2 = '', extras = []) => {
	const extraPart = extras.map((entry) => `|${entry}`).join('');
	return `{{R-letters  |${index} |${selection}|${p1}|${p2}|${dic}|${next}|${next2}${extraPart}}}`;
};

const numbersRound = (index, numbers, target, p1, p1Sol, p2, p2Sol, best = '', bestSol = '', extras = []) => {
	const extraPart = extras.map((entry) => `|${entry}`).join('');
	return `{{R-numbers  |${index} | ${numbers.join('|')}| ${target}|${p1}|${p1Sol}|${p2}|${p2Sol}|${best}|${bestSol}${extraPart}}}`;
};

const conundrumRound = (index, selection, { c1Time, c1Sol, c2Time, c2Sol, solution, extras = [] } = {}) => {
	const bits = [`{{R-conundrum|${index}|${selection}`];
	if (c1Time !== undefined) bits.push(`c1time=${c1Time}`);
	if (c1Sol) bits.push(`c1sol=${c1Sol}`);
	if (c2Time !== undefined) bits.push(`c2time=${c2Time}`);
	if (c2Sol) bits.push(`c2sol=${c2Sol}`);
	if (solution) bits.push(`sol=${solution}`);
	extras.forEach((entry) => bits.push(entry));
	return `${bits.join('|')}}}`;
};

const createEpisodeData = ({
	episodeNumber,
	series = 'Series 88',
	rounds,
	player1 = 'Player Alpha',
	player2 = 'Player Beta',
	winner = 'Player Alpha',
	scores = [134, 57],
	presenter = 'Presenter Example',
	arith = 'Arith Example',
	lex = 'Lex Icon',
	guests = ['Guest One'],
	date = '1 January 2024',
	customIntro,
}) => {
	const [winScore, loseScore] = scores;
	const intro = customIntro ?? `'''Episode ${episodeNumber}''' was broadcast on ${date}, as part of [[${series}]].`;
	return `{{episode|previous=Episode ${episodeNumber - 1}|next=Episode ${episodeNumber + 1}}}
${intro}

[[${player1}]] played [[${player2}]], with ${winner} winning {{score|${winScore}|${loseScore}}}. The [[Dictionary Corner]] guest was [[${
		guests[0]
	}]], and the [[lexicographer]] was [[${lex}]].

${
	rounds
		? `
==Rounds==
{{Rounds-start|${player1}|${player2}}}
${rounds}
{{Rounds-end}}
`
		: ''
}


[[Category:Episodes in ${series}]]
[[Category:Episodes presented by ${presenter}]]
[[Category:Episodes with ${arith} as arithmetician]]
[[Category:Episodes with ${lex} as lexicographer]]
${guests.map((guest) => `[[Category:Episodes with ${guest} as a guest]]`).join('\n')}
`;
};

const letters = [
	lettersRound(1, 'ABCDEFGHI', 'ALIGNED', 'badger x', 'ALIGNED, DEALING*, DEALIGNS*', 'ALT1', 'ALT2'),
	lettersRound(2, 'BCDEFGHIJ', 'x amber', 'UPSTART', 'UPSTART, RUPTNAS*', 'ALT', 'ALT'),
	lettersRound(3, 'CDEFGHIJK', 'BLAZE X', 'FRAZLES', 'FRAZLES', 'ALT', 'ALT'),
	lettersRound(4, 'DEFGHIJKL', 'PAEDERAST**', 'roadside** x', 'ROADSIDES', 'ALT', 'ALT'),
	lettersRound(5, 'EFGHIJKLM', 'GLITTER**', 'SILKY*', 'SILKIEST, SLIKET*', 'ALT', 'ALT'),
	lettersRound(6, 'FGHIJKLMN', 'glaves x**', 'twig X', 'TWIG', 'ALT', 'ALT'),
	lettersRound(7, 'GHIJKLMNO', '7', '&mdash;', 'GIRLHOOME', 'ALT', 'ALT'),
	lettersRound(8, 'HIJKLMNOP', 'TRIANGLE/ALERTING', 'signal/original x', 'REALIGN, ALIGNERS*', 'ALT', 'ALT'),
	lettersRound(9, 'IJKLMNOPQ', 'nwd', 'POLENTA', 'PRETONAL', 'REPLANT', 'ALT'),
	lettersRound(10, 'JKLMNOPQR', 'JACKPOTS', 'nwd', 'BEEHIVES', 'OVERRICH', 'ALT'),
	lettersRound(11, 'KLMNOPQRS', 'misdeclared', 'CABINET', '7', 'ENTRACT', 'CANDLERS'),
	lettersRound(12, 'LMNOPQRST', 'BRAINERS', 'misdeclared', 'CABARETS', '6', 'DIVERTS'),
	lettersRound(13, 'MNOPQRSTU', 'SCORINGS', 'wronglyallowed', 'ANEROIDS', 'SNARLERS', 'ALT'),
	lettersRound(14, 'NOPQRSTUV', 'notasked', '7', 'RUDERIES', 'ALTWORD', 'ALT'),
];

const numbers = [
	numbersRound(15, ['25', '50', '75', '100', '6', '1'], 900, 'nwd', '905', 'timedout', '890', 'other=899', 'solother=(100×9)-?', ['extra']),
	numbersRound(16, ['3', '6', '9', '25', '50', '75'], 466, '510', '450', '300/299', 'sol2=(300 + 166)', 'a=300', 'sola=25×12', [
		'rr=466',
		'solrr=25×(9+9)',
	]),
	numbersRound(17, ['2', '4', '6', '8', '3', '9'], 123, '&mdash;', '', '200/199 x', '', '', '', []),
];

const conundrums = [
	conundrumRound(18, 'mysteryzz*', {
		c1Time: '12',
		c1Sol: 'storm x',
		c2Time: '?',
		c2Sol: 'c2sol=? {{x}}',
		solution: 'MYSTERYZZ',
		extras: ['billandgyles'],
	}),
];

const complexRounds = [
	letters[0],
	letters[1],
	numbers[0],
	letters[2],
	letters[3],
	numbers[1],
	letters[4],
	letters[5],
	letters[6],
	letters[7],
	numbers[2],
	letters[8],
	letters[9],
	letters[10],
	letters[11],
	letters[12],
	letters[13],
	...conundrums,
].join('\n');

const baseRounds = [letters[0], letters[1], letters[2], numbers[0], letters[3], letters[4], numbers[1], letters[5], conundrums[0]].join(
	'\n'
);

describe('parseEpisode synthetic coverage', () => {
	beforeEach(() => {
		initLog();
	});

	test('parses a dense episode with many edge cases', () => {
		const data = createEpisodeData({
			episodeNumber: 9001,
			series: 'Series 88',
			rounds: complexRounds,
			guests: ['Guest One', 'Guest Two'],
		});
		const episode = parseEpisode(data, 9001);

		expect(episode.e).toBe(9001);
		expect(episode.s).toMatchObject({ n: 88, t: 'series', l: 'Series_88' });
		expect(episode.g).toEqual(['Guest One', 'Guest Two']);

		const lettersRounds = episode.r.filter((round) => round.tp === 'letters');
		expect(lettersRounds).toHaveLength(14);

		const paederastRound = lettersRounds.find((round) => round.l === 'DEFGHIJKL');
		expect(paederastRound['1']).toBe('PAEDERAST');
		expect(paederastRound['2']).toBe('ROADSIDE');

		const misdeclaredRound = lettersRounds.find((round) => round.l === 'KLMNOPQRS');
		expect(misdeclaredRound['1']).toBe('CABINET');
		expect(misdeclaredRound['1-bad']).toBe(true);
		expect(misdeclaredRound['2']).toBe('ENTRACT');

		const wronglyAllowedRound = lettersRounds.find((round) => round.l === 'MNOPQRSTU');
		expect(wronglyAllowedRound['2-bad']).toBe(true);
		expect(wronglyAllowedRound['2']).toBe('ANEROIDS');

		const numbersRounds = episode.r.filter((round) => round.tp === 'numbers');
		expect(numbersRounds).toHaveLength(3);
		expect(numbersRounds[0]['best-sol']).toContain('(100');
		expect(numbersRounds[1]['best']).toBe(300);

		const conundrum = episode.r.find((round) => round.tp === 'conundrum' && round.l === 'MYSTERYZZ');
		expect(conundrum['1-valid']).toBe(false);
		expect(conundrum['2-valid']).toBe(false);

		expect(conundrum['1']).toBe('BILLGYLES');
		expect(conundrum.s).toBe('MYSTERYZZ');
	});

	test('special rounds behave differently for episode 7795', () => {
		const data = createEpisodeData({
			episodeNumber: 7795,
			series: 'Championship of Champions VI',
			rounds: complexRounds,
			winner: 'Player Beta',
			scores: [77, 65],
			guests: ['Solo Guest'],
		});
		const episode = parseEpisode(data, 7795);

		expect(episode.e).toBe(7795);
		expect(episode.s).toMatchObject({ t: 'coc' });
		expect(episode.p2.s).toBe(77);
		expect(episode.p1.s).toBe(65);
		expect(episode.g).toBe('Solo Guest');

		const rudeRound = episode.r.find((round) => round.l === 'NOPQRSTUV');
		expect(rudeRound['1']).toBe('FANNIES');
	});

	test('pulled episodes short-circuit parsing', () => {
		const data = createEpisodeData({
			episodeNumber: 7779,
			rounds: baseRounds,
			customIntro: "'''Episode 7779''' was broadcast on 2 January 2024, as part of [[Series 88]], but was pulled from broadcast.",
		});
		expect(parseEpisode(data, 7779)).toBe(false);
	});

	test('parses ZoomDown recaps', () => {
		const data = createEpisodeData({
			episodeNumber: 12,
			series: 'ZoomDown Series 4',
			rounds: baseRounds,
			customIntro: "'''Episode ZD12''' was broadcast live on YouTube on 3 February 2024.",
		});
		const episode = parseEpisode(data, 12);
		expect(episode.s).toMatchObject({ t: 'zoomdown', l: '/ZoomDown_Series_', n: 0 });
	});

	test('throws when article number does not match and is not expected-1', () => {
		const data = createEpisodeData({
			episodeNumber: 5000,
			rounds: baseRounds,
		});
		// Mismatch of more than 1 should throw
		expect(() => parseEpisode(data, 5002)).toThrow('Could not parse date or series');
	});

	test('accepts article number mismatch of exactly expected-1 (copy/paste scenario)', () => {
		const data = createEpisodeData({
			episodeNumber: 5000,
			rounds: baseRounds,
		});
		// Mismatch of exactly 1 (yesterday's copy/paste) should succeed with corrected episode number
		const episode = parseEpisode(data, 5001);
		expect(episode.e).toBe(5001);
	});

	test('rejects older broadcasts unless flagged as update', () => {
		const newer = createEpisodeData({
			episodeNumber: 9100,
			rounds: baseRounds,
			date: '10 March 2024',
		});
		const older = createEpisodeData({
			episodeNumber: 9101,
			rounds: baseRounds,
			date: '1 March 2024',
		});
		parseEpisode(newer, 9100);
		expect(() => parseEpisode(older, 9101)).toThrow('Could not parse date or series');
		expect(() => parseEpisode(older, 9101, true)).not.toThrow();
	});

	test('detects special series formats', () => {
		const specialCases = [
			{ episodeNumber: 1003, series: 'Bill Tidy', expected: { n: 11 } },
			{ episodeNumber: 1003, series: 'Series 11 celebrations', expected: { n: 20, l: 'Series_20' } },
			{ episodeNumber: 2874, series: '18th Anniversary Special', expected: { n: 43 } },
			{ episodeNumber: 4000, series: '30th Birthday Championship', expected: { t: '30birthday' } },
			{ episodeNumber: 5000, series: 'Series 33|Supreme Championship', expected: { t: 'supreme', n: 33 } },
			{ episodeNumber: 6000, series: 'Junior Championship|junior tournament', expected: { t: 'junior' } },
			{ episodeNumber: 7000, series: "Ladies' Championship|ladies' tournament", expected: { t: 'ladies' } },
			{ episodeNumber: 7100, series: 'ZoomDown Series 5', expected: { t: 'zoomdown', n: 5 } },
		];
		specialCases.forEach((cfg, idx) => {
			const data = createEpisodeData({
				episodeNumber: cfg.episodeNumber,
				series: cfg.series,
				rounds: baseRounds,
				date: `${idx + 11} March 2024`,
			});
			const episode = parseEpisode(data, cfg.episodeNumber, true);
			expect(episode.s.t).toBe(cfg.expected.t ?? 'series');
			if (cfg.expected.n !== undefined) expect(episode.s.n).toBe(cfg.expected.n);
			if (cfg.expected.l) expect(episode.s.l).toBe(cfg.expected.l);
		});
	});

	test('malformed inputs', () => {
		const episodeData = createEpisodeData({
			episodeNumber: 9001,
			series: 'Series 88',
			rounds: false,
			date: '25 March 2024',
		});
		const episode = parseEpisode(episodeData, 9001);
		expect(episode).toBeFalsy();
	});
});
