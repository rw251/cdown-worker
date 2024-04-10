import { fileFromNumber } from './fileUtils';
import { logMessage } from './log';

let lastFirstShownDate = new Date('1980-01-01');

const getPresenter = (data) => {
	const match = data.match(/Category:Episodes presented by ([^\]]+)\]/);
	if (!match || match.length < 2) return '';
	const [, presenter] = match;
	return presenter;
};
const getArith = (data) => {
	const match = data.match(/Category:Episodes with ([^\n]+) as arithmetician\]/);
	if (!match || match.length < 2) return '';
	const [, arithmetician] = match;
	return arithmetician;
};
const getLex = (data) => {
	const match = data.match(/Category:Episodes with ([^\n]+) as lexicographer\]/);
	if (!match || match.length < 2) return '';
	const [, lexicographer] = match;
	return lexicographer;
};
const getGuest = (data) => {
	const regex = /Category:Episodes with ([^\]]+) as a guest/g;
	let matches = regex.exec(data);
	const guests = [];
	while (matches) {
		guests.push(matches[1]);
		matches = regex.exec(data);
	}
	if (guests.length === 0) return '';
	if (guests.length > 1) return guests;
	return guests[0];
};
const getEpisodeDateAndSeries = (data, epNumberShouldBe) => {
	// Quick check in case episode pulled from broadcast
	let pulledMatch = data.match(/broadcast on ([^,[:]+).*pulled( from)?( the)? broadcast/);
	if (pulledMatch) {
		let fsd = new Date(pulledMatch[1]);
		fsd.setHours(fsd.getHours() + 3);
		return { firstShownDate: fsd };
	}

	let potZdMatch = data.match(/Episode ZD([0-9]+)''' *was broadcast (?:live on YouTube )?on ([^,[:]+)./);
	if (potZdMatch) {
		return {
			episodeNumber: +potZdMatch[1],
			firstShownDate: new Date(potZdMatch[2]),
			seriesNumber: 0,
			seriesType: 'zoomdown',
			seriesLink: '/ZoomDown_Series_',
		};
	}
	let [, episodeNumber, firstShownDate, series] = data.match(
		/Episode (Z?D?[0-9]+)''' *was (?:scheduled to be )?broadcast on ([^,[:]+),?(?: as| at| and| was| immediately (?:after|before) \[\[(?:[^\]]+)\]\])[^[]+\[\[([^\]]+)\]\]/
	);
	// '''Episode 7652''' was scheduled to be broadcast on 3 December 2021, as part of [[Series 84]].
	if (episodeNumber.indexOf('ZD') < 0) episodeNumber = +episodeNumber;
	firstShownDate = new Date(firstShownDate);
	firstShownDate.setHours(firstShownDate.getHours() + 3);
	if (series === 'Bill Tidy') series = 'Series 11'; // special episode (495)

	if (episodeNumber !== epNumberShouldBe) {
		logMessage(`In episode ${epNumberShouldBe} the parsed episode number is actually ${episodeNumber}`);
		return {};
	}
	if (episodeNumber > 1 && firstShownDate < lastFirstShownDate) {
		logMessage(`Episode ${episodeNumber} is shown before the previous episode`);
		return {};
	}

	// Get series classification
	const normalSeries = series.match(/^Series ([0-9]+)$/);
	const cocSeries = series.match(/^Championship of Champions [IVXLC]+$/);
	const thirtySeries = series.match(/^30th Birthday Championship$/);
	const supremeSeries = series.match(/^Series 33\|Supreme Championship$/);
	const juniorSeries = series.match(/^Junior Championship\|junior tournament$/);
	const ladiesSeries = series.match(/^Ladies' Championship\|ladies' tournament$/);
	const zoomdownSeries = series.match(/^ZoomDown Series ([0-9]+)$/);
	let seriesNumber;
	let seriesType = 'series';
	let seriesLink = series.split('|')[0].replace(/ /g, '_');
	if (normalSeries) {
		seriesNumber = +normalSeries[1];
	} else if (cocSeries) {
		seriesType = 'coc';
		[, seriesNumber] = cocSeries;
	} else if (thirtySeries) {
		seriesType = '30birthday';
	} else if (episodeNumber === 1003) {
		// special for '1000th' episode in series 20
		seriesLink = 'Series_20';
		seriesNumber = 20;
	} else if (episodeNumber === 2874) {
		// special for 18th birthday
		seriesNumber = 43;
	} else if (supremeSeries) {
		seriesNumber = 33;
		seriesType = 'supreme';
	} else if (juniorSeries) {
		seriesType = 'junior';
	} else if (ladiesSeries) {
		seriesType = 'ladies';
	} else if (zoomdownSeries) {
		seriesType = 'zoomdown';
		seriesNumber = +zoomdownSeries[1];
	} else {
		logMessage(`Unrecognised series format - ${series} - in episode ${episodeNumber}`);
	}

	lastFirstShownDate = firstShownDate;

	return {
		episodeNumber,
		firstShownDate,
		seriesNumber,
		seriesType,
		seriesLink,
	};
};

const getPlayersAndWinner = (data, n) => {
	if (+n === 3 || +n === 8) return {}; // two early draws - but no info so skip
	let [, player1, player2, winner, winScore, loseScore, winScore2, loseScore2] = data.match(
		/\[\[([^\]]+)\]\][ ,]*(?:\([^)]+\) )?played[^[]+\[\[([^\]]+)\]\],?.*with (.*) (?:winning ?(?:\{\{[Ss]core\|([0-9]+)\|([0-9]+)|([0-9]+)[^0-9]+([0-9]+))?|([0-9]+)(-all) draw)/
	);
	if (loseScore === 'all') {
		loseScore = winScore;
	}
	if (winScore === undefined && loseScore === undefined) {
		winScore = winScore2;
		loseScore = loseScore2;
	}
	let p1Score = +winScore;
	let p2Score = +loseScore;
	if (player1.indexOf(winner) > -1) {
		winner = 'p1';
	} else if (player2.indexOf(winner) > -1) {
		winner = 'p2';
		[p1Score, p2Score] = [p2Score, p1Score];
	} else if (winner.indexOf('game ending') > -1) {
		winner = 'draw';
		const matches = data.match(/\{\{R-conundrum[^\n]+\|([0-9]+)\|([0-9]+)\|[^|]+\}\}/);
		if (matches.length !== 3) {
			logMessage(`Conundrum regex in episode ${n} doesn't have 3 matches`);
		} else if (matches[1] !== matches[2]) {
			logMessage(`Conundrum regex in drawn episode ${n} doesn't have matches equalling`);
		} else {
			p1Score = +matches[1];
			p2Score = p1Score;
		}
	} else if (n === 495) {
		player1 = 'Bill Tidy';
		winner = 'p1';
	} else if (n === 2874) {
		winner = 'p1';
	} else logMessage(`In episode${n} I don't know who won. ${player1} played ${player2} with ${winner} winning`);
	const p1Link = player1.split('|')[0].split(' ').join('_');
	const p2Link = player2.split('|')[0].split(' ').join('_');
	if (player1.indexOf('|') > -1) {
		[, player1] = player1.split('|');
	}
	if (player2.indexOf('|') > -1) {
		[, player2] = player2.split('|');
	}
	return {
		player1,
		player2,
		p1Link,
		p2Link,
		winner,
		p1Score,
		p2Score,
	};
};
const validateDeclaration = (dec, round, episodeNumber) => {
	let failed = false;
	let { length } = dec;
	let valid = true;
	let word = dec.toUpperCase();
	if (dec.search(/^[A-Z]{1,9}$/) === 0) {
		// CHECKED
		// Standard valid declaration e.g. BADGER
		// do nothinig
	} else if (dec.search(/^[a-z]+ +x$/) === 0) {
		// CHECKED
		// Standard invalid declaration e.g. badger x
		valid = false;
		word = dec.match(/^([a-z]+) +x$/)[1].toUpperCase();
		({ length } = word);
	} else if (dec.search(/^x +[a-z]+$/) === 0) {
		// CHECKED
		// Alternative invalid declaration e.g. x badger
		valid = false;
		word = dec.match(/^x +([a-z]+)$/)[1].toUpperCase();
		({ length } = word);
	} else if (dec.search(/^[A-Z]+ +X$/) === 0) {
		// CHECKED
		// Invalid declaration because not written down BUT also would have been disallowed
		// - gets capitalized by me for some reason
		valid = false;
		word = dec.match(/^([A-Z]+) +X$/)[1].toUpperCase();
		({ length } = word);
	} else if (dec.search(/^(PAEDERAST)\*\*$/) === 0) {
		// Dodgy words not broadcast but allowed
		valid = true;
		word = dec.match(/^([A-Z]{1,9})\*\*$/)[1].toUpperCase();
		({ length } = word);
	} else if (dec.search(/^[A-Z]{1,9}\*\*$/) === 0) {
		// CHECKED
		// Probably should have been disallowed
		valid = false;
		word = dec.match(/^([A-Z]{1,9})\*\*$/)[1].toUpperCase();
		({ length } = word);
	} else if (dec.search(/^[A-Z]{1,9}\*$/) === 0) {
		// CHECKED
		// Initially not allowed but should have been
		word = dec.match(/^([A-Z]{1,9})\*$/)[1].toUpperCase();
		({ length } = word);
	} else if (dec.search(/^[a-z]{1,9} x\*\*$/) === 0) {
		// CHECKED
		// TODO check all of these
		word = dec.match(/^([a-z]{1,9}) x\*\*$/)[1].toUpperCase();
		({ length } = word);
		if (['GOATED', 'GILTED', 'TONNE', 'SOPIER', 'MORALES', 'GLAVES', 'MARINER', 'RADAR'].indexOf(word) > -1) {
			// should have been invalid
			valid = false;
		} else {
			valid = true;
		}
	} else if (dec.search(/^[a-z]{1,9} [☓X]$/) === 0) {
		// Word doesn't exist
		valid = false;
		word = dec.match(/^([a-z]{1,9}) [☓X]$/)[1].toUpperCase();
		({ length } = word);
	} else if (dec.search(/^[0-9]$/) === 0) {
		// Declared length - but ddn't gve word
		valid = false;
		length = +dec;
		word = '';
	} else if (dec === '&mdash;' || dec === '—' || dec === '-' || dec === '−' || dec === 'x') {
		// No declaration
		valid = false;
		length = 0;
		word = '';
	} else if (dec.search(/^[A-Z]{1,9}(\/[A-Z]{1,9})+$/) === 0) {
		// Valid declartion - not sure of word e.g. TRIANGLE/ALERTING
		[word] = dec.split('/');
		({ length } = word);
	} else if (dec.search(/^[a-z]{1,9}(\/[a-z]{1,9})+ ?x$/) === 0) {
		// Invalid declartion - not sure of word e.g. TRIANGLE/ALERTING
		[word] = dec.toUpperCase().split('/');
		valid = false;
		({ length } = word);
	} else if (dec === '?' || dec === '?x') {
		// Invalid round
		failed = true;
	} else if (dec === 'roadside** x') {
		// dsallowed shouldn't have been
		word = 'ROADSIDE';
		length = 8;
	} else if (dec === 'notasked' && episodeNumber === 7795) {
		// Didn't ask because he probably had FANNIES
		word = 'FANNIES';
		length = 7;
	} else {
		logMessage(`In episode ${episodeNumber}, can't parse player's declaration [${dec}] from round: ${round}`);
	}
	return [word, length, valid, failed];
};

const processLettersRound = (round, episodeNumber) => {
	// At least one episode contains a <sup>'''[[Countdown:Recap checking style guide|7]]'''</sup>
	// which messes things up - but it's fine to remove
	while (round.indexOf('<sup>') > -1) {
		round = round.replace(/<sup[^<]+<\/sup>/, '');
	}

	// R-letters |13|RYMIEAHSL|mashier x |nwd|mashier x |EARLYISH| 54|73 |105
	let [, , selection, p1Declares, p2Declares, dicCorner, next, next2] = round.split('|').map((x) => x.trim());
	let p1Length = p1Declares.length;
	let p2Length = p2Declares.length;
	let p1Valid = true;
	let p2Valid = true;
	let failed = false;
	if (selection.search(/^[A-Z]{9}$/) !== 0) failed = true;
	else {
		if (p1Declares === 'nwd') {
			// not written down so shift
			p1Declares = p2Declares.toUpperCase();
			p2Declares = dicCorner;
			dicCorner = next;
		} else if (p2Declares === 'nwd') {
			p2Declares = dicCorner.toUpperCase();
			dicCorner = next;
		}
		if (p1Declares === 'misdeclared' && next === 'misdeclared') {
			logMessage(`In episode ${episodeNumber} haven't dealt wth 2 misdeclared: ${round}`);
		}
		if (p1Declares === 'notasked' && p2Declares.length === 1) {
			// A rude word so was down as {{notasked|7}}
			p2Declares = dicCorner;
			dicCorner = next;
		}
		if (p1Declares.indexOf('misdeclared') > -1) {
			// not written down so shift
			p1Length = dicCorner;
			p1Valid = false;
			p1Declares = p2Declares.toUpperCase();
			p2Declares = next;
			dicCorner = next2;
			[p2Declares, p2Length, p2Valid, failed] = validateDeclaration(p2Declares, round, episodeNumber);
		} else if (p2Declares.indexOf('misdeclared') > -1) {
			p2Length = next;
			p2Valid = false;
			p2Declares = dicCorner.toUpperCase();
			dicCorner = next2;
			[p1Declares, p1Length, p1Valid, failed] = validateDeclaration(p1Declares, round, episodeNumber);
		} else if (p2Declares === 'wronglyallowed') {
			p2Length = dicCorner.length;
			p2Valid = false;
			p2Declares = dicCorner.toUpperCase();
			dicCorner = next;
			[p1Declares, p1Length, p1Valid, failed] = validateDeclaration(p1Declares, round, episodeNumber);
		} else {
			[p1Declares, p1Length, p1Valid, failed] = validateDeclaration(p1Declares, round, episodeNumber);
			[p2Declares, p2Length, p2Valid, failed] = validateDeclaration(p2Declares, round, episodeNumber);
		}
	}

	const d = dicCorner
		.split(',')
		.map((x) => x.trim())
		.filter((x) => x.indexOf('*') < 0 && x.length > 0);
	const c = dicCorner
		.split(',')
		.map((x) => x.trim())
		.filter((x) => x.indexOf('*') > -1 && x.length > 0)
		.map((x) => x.replace(/[*]+/g, ''));
	const rtn = {
		l: selection,
		1: p1Declares,
		2: p2Declares,
		failed,
	};
	if (p1Declares.length !== p1Length) rtn['1-length'] = p1Length;
	if (p2Declares.length !== p2Length) rtn['2-length'] = p2Length;
	if (!p1Valid) rtn['1-bad'] = true;
	if (!p2Valid) rtn['2-bad'] = true;
	if (d.length > 0) rtn.d = d;
	if (c.length > 0) rtn.c = c;
	return rtn;
};
const validateNumberDeclaration = (declares, solution, round, failed, episodeNumber) => {
	if (solution.toLowerCase().indexOf('sol') === 0) {
		// answer with valid solution
		declares = +declares;
		solution = solution.split('=').slice(1).join('');
	} else if (declares.indexOf('?') > -1) {
		failed = true;
	} else if (declares.search(/^([0-9]{3}|10[01][0-9]) [x☓X]$/) === 0) {
		// made a declaration but then messed it up
		declares = +declares.split(' ')[0];
		solution = false;
	} else if (declares === '&mdash;' || declares === '—' || declares === '-' || declares === '−' || declares === 'x') {
		// nowhere near
		declares = 0;
		solution = '';
	} else if (+declares >= 100 && +declares <= 1010 && solution === '') {
		// valid (possibly) but beaten by opponent so who knows
		declares = +declares;
		solution = '';
	} else if (declares.search(/^[0-9]{3}\/[0-9]{3}$/) === 0) {
		// person said "x away" but was beaten anyway so never gave solution
		declares = +declares.split('/')[0];
		solution = '';
	} else if (declares.search(/^[0-9]{3}\/[0-9]{3} [x☓X]$/) === 0) {
		// person said "x away" but somehow then went wrong
		declares = +declares.split('/')[0];
		solution = false;
	} else if ((+declares.replace(/,/g, '') < 100 || +declares.replace(/,/g, '') > 1010) && solution === '') {
		// valid (possibly) but too far away
		solution = '';
		declares = +declares;
	} else if (solution.toLowerCase() === 'timedout') {
		// timed out when asked for solution
		declares = +declares;
		solution = false;
	} else {
		logMessage(`In episode ${episodeNumber} error with round. Declares is ${declares}, solution is ${solution}, round is ${round}`);
	}
	return [declares, solution, failed];
};

const processNumbersRound = (round, episodeNumber) => {
	let [, , n1, n2, n3, n4, n5, n6, target, p1Declares, p1Solution, p2Declares, p2Solution, best, bestSol] = round
		.split('|')
		.map((x) => x.trim());
	let failed = false;
	if (p1Declares === 'nwd') {
		[p1Declares, p1Solution] = [p1Solution, ''];
	} else if (p1Declares === 'timedout') {
		[p1Declares, p1Solution] = [p1Solution, p1Declares];
	} else if (p1Solution.toLowerCase().indexOf('sol') < 0) {
		[p2Declares, p2Solution, best, bestSol] = [p1Solution, p2Declares, p2Solution, best];
		p1Solution = '';
	}
	if (p2Declares === 'nwd') {
		[p2Declares, p2Solution] = [p2Solution, ''];
	} else if (p2Declares === 'timedout') {
		[p2Declares, p2Solution] = [p2Solution, p2Declares];
	} else if (p2Solution.toLowerCase().indexOf('sol') < 0) {
		[best, bestSol] = [p2Solution, best];
		p2Solution = '';
	}
	const otherMatch = round.match(/(other=[0-9]+)\|(solother=[^|]+)\|/i);
	if (otherMatch && otherMatch.length === 3) {
		best = otherMatch[1];
		bestSol = otherMatch[2];
	}

	if (target.indexOf('?') > -1 || target === '' || p1Declares === '?' || p2Declares === '?') {
		failed = true;
	} else {
		[p1Declares, p1Solution, failed] = validateNumberDeclaration(p1Declares, p1Solution, round, failed, episodeNumber);
		[p2Declares, p2Solution, failed] = validateNumberDeclaration(p2Declares, p2Solution, round, failed, episodeNumber);
	}
	if (p1Declares === +target && p1Solution !== false && p1Solution.length > 0) {
		[best, bestSol] = [+target, p1Solution];
	} else if (p2Declares === +target && p2Solution !== false && p2Solution.length > 0) {
		[best, bestSol] = [+target, p2Solution];
	}
	const rtn = {
		n: [+n1, +n2, +n3, +n4, +n5, +n6],
		t: +target,
		'1-sol': p1Solution,
		'2-sol': p2Solution,
		failed,
	};
	if (p1Declares > 0) rtn['1'] = p1Declares;
	if (p2Declares > 0) rtn['2'] = p2Declares;
	if (+best !== +target) {
		rtn.best = +best.split('=')[1];
		rtn['best-sol'] = bestSol.split('=')[1];
	}
	if (Number.isNaN(rtn.best)) {
		delete rtn.best;
		delete rtn['best-sol'];
	}
	return rtn;
};
const processConundrumRound = (round, episodeNumber) => {
	let [, , selection] = round.split('|').map((x) => x.trim());
	let failed = false;
	if (selection.search(/^[A-Z]{9}$/) === 0) {
		// standard
	} else if (selection.search(/^[a-z]{9}\*$/i) === 0) {
		// don't know the order
		selection = selection.substr(0, 9).toUpperCase();
	} else if (selection.indexOf('?') > -1) {
		failed = true;
	} else {
		logMessage(`In episode ${episodeNumber} the conundrum of ${selection} can't be parsed`);
	}
	if (round.search(/c1sol=\?/) > -1 && round.search(/c2sol=\?/) > -1) {
		failed = true;
	}

	let p1Time = -1;
	let p2Time = -1;
	let p1Sol;
	let p2Sol;
	let p1Valid;
	let p2Valid;
	let solution;
	if (!failed) {
		if (round.indexOf('billandgyles') > -1) {
			p1Sol = 'BILLGYLES';
			p1Valid = false;
			p1Time = 14;
			p2Sol = '';
			p2Valid = false;
			p2Time = 1;
		} else {
			if (round.indexOf('c1sol') > -1) {
				if (round.search(/c1sol=[a-z]+ [^|]*x/) > -1) {
					p1Sol = round.match(/c1sol=([a-z]+) /)[1].toUpperCase();
					p1Valid = false;
				} else if (round.search(/c1sol=\?? ?\{?\{?[x☓X]\}?\}?\|/) > -1) {
					p1Sol = '';
					p1Valid = false;
				} else if (round.search(/c1sol= *[A-Za-zÀ-ÖØ-öø-ÿ.]+ [^|]*[x☓X]/) > -1) {
					p1Sol = round.match(/c1sol= *([a-z]+)/)[1].toUpperCase();
					p1Valid = false;
				} else if (round.replace(/ /g, '').search(/c1sol=[x☓X]/) > -1) {
					p1Sol = '';
					p1Valid = false;
				} else {
					p1Sol = round.match(/c1sol=([A-Z]+)/)[1];
					p1Valid = true;
					solution = p1Sol;
				}
				p1Time = round.match(/c1time=([^|]+)\|/)[1];
				if (p1Time === '?') p1Time = 15;
				p1Time = +p1Time;
			}
			if (round.indexOf('c2sol') > -1) {
				if (round.search(/c2sol=[a-z]+ [^|]*x/) > -1) {
					p2Sol = round.match(/c2sol=([a-z]+) /)[1].toUpperCase();
					p2Valid = false;
				} else if (round.search(/c2sol=[x☓X] [a-z]+/) > -1) {
					p2Sol = round.match(/c2sol=[x☓X] ([a-z]+)/)[1].toUpperCase();
					p2Valid = false;
				} else if (round.search(/c2sol=\?? ?\{?\{?[x☓X]\}?\}?\|/) > -1) {
					p2Sol = '';
					p2Valid = false;
				} else if (round.search(/c2sol= *[A-Za-zÀ-ÖØ-öø-ÿ.]+ [^|]*[x☓X]/) > -1) {
					p2Sol = round.match(/c2sol= *([a-z]+)/)[1].toUpperCase();
					p2Valid = false;
				} else if (round.replace(/ /g, '').search(/c2sol=[x☓X]/) > -1) {
					p2Sol = '';
					p2Valid = false;
				} else {
					p2Sol = round.match(/c2sol=([A-Z]+)/)[1];
					p2Valid = true;
					solution = p2Sol;
				}
				p2Time = round.match(/c2time=([^|]+)\|/)[1];
				if (p2Time === '?') p2Time = 15;
				p2Time = +p2Time;
			}
		}
		if (round.indexOf('|sol') > -1) {
			if (round.search(/sol=[A-Z]{9}/) > -1) {
				solution = round.match(/sol=([A-Z]{9})/)[1];
			} else {
				logMessage(`In episode ${episodeNumber} problem with conundrum: ${round}`);
			}
		}
	}
	const rtn = {
		l: selection,
		s: solution,
		failed,
	};
	if (p1Time > -1) {
		rtn['1-time'] = p1Time;
		rtn['1-valid'] = p1Valid;
		rtn['1'] = p1Sol;
	}
	if (p2Time > -1) {
		rtn['2-time'] = p2Time;
		rtn['2-valid'] = p2Valid;
		rtn['2'] = p2Sol;
	}
	return rtn;
};
const processRound = (round, episodeNumber) => {
	let rtn = {};
	round = round.replace(/&amp;/g, '&');
	if (round.indexOf('R-letters') > -1 || round.indexOf('Rx-letters') > -1) {
		rtn = { ...processLettersRound(round, episodeNumber), tp: 'letters' };
		if (rtn.failed) {
			delete rtn.tp;
		} else {
			delete rtn.failed;
		}
	} else if (round.indexOf('R-numbers') > -1) {
		round = round.replace('&mdash;', '-'); // trying to fix pesky issue with &mdash; string comparison
		// might need this for letters as well, but doesn't seem to
		// break it so far
		rtn = { ...processNumbersRound(round, episodeNumber), tp: 'numbers' };
		if (rtn.failed) {
			delete rtn.tp;
		} else {
			delete rtn.failed;
		}
	} else if (round.indexOf('R-conundrum') > -1) {
		rtn = { ...processConundrumRound(round, episodeNumber), tp: 'conundrum' };
		if (rtn.failed) {
			delete rtn.tp;
		} else {
			delete rtn.failed;
		}
	}
	return rtn;
};

const processRounds = (data, episodeNumber) => {
	if (data.indexOf('Rounds-start') < 0) return [];
	let rounds = data.match(/Rounds-start(?:.|[\r\n])+Rounds-end/g)[0].replace(/[{}]/g, '');
	let numbersIndex = rounds.indexOf('R-numbers');
	while (numbersIndex > -1) {
		let nextLettersIndex = rounds.indexOf('R-letters', numbersIndex);
		if (nextLettersIndex < 0) nextLettersIndex = rounds.indexOf('Rx-letters', numbersIndex);
		const nextConundrumIndex = rounds.indexOf('R-conundrum', numbersIndex); // in case of 2 conundrums in special finals
		if (nextLettersIndex < 0 || nextConundrumIndex < nextLettersIndex) {
			nextLettersIndex = nextConundrumIndex;
		}
		rounds =
			rounds.substr(0, numbersIndex) +
			rounds.substr(numbersIndex, nextLettersIndex - numbersIndex).replace(/[\n\r]/g, '') +
			rounds.substr(nextLettersIndex - 1);
		numbersIndex = rounds.indexOf('R-numbers', nextLettersIndex);
	}
	// Sometimes the conundrum is on multiple lines as well as the number rounds
	let conundrumIndex = rounds.indexOf('R-conundrum');
	while (conundrumIndex > -1) {
		let nextLettersIndex = rounds.indexOf('R-letters', conundrumIndex);
		if (nextLettersIndex < 0) nextLettersIndex = rounds.indexOf('Rx-letters', conundrumIndex);
		if (nextLettersIndex < 0) nextLettersIndex = Number.POSITIVE_INFINITY;
		rounds =
			rounds.substr(0, conundrumIndex) +
			rounds.substr(conundrumIndex, nextLettersIndex - conundrumIndex).replace(/[\n\r]/g, '') +
			rounds.substr(nextLettersIndex - 1);
		conundrumIndex = rounds.indexOf('R-conundrum', nextLettersIndex);
	}
	return rounds
		.split('\n')
		.map((x) => processRound(x, episodeNumber))
		.filter((x) => x.tp);
};

const parseEpisode = (episode, i) => {
	const { episodeNumber, firstShownDate, seriesNumber, seriesType, seriesLink } = getEpisodeDateAndSeries(episode, i);
	if (i === 7779 && !episodeNumber) {
		// episode pulled
		return false;
	}
	if (i > 0 && !episodeNumber) throw new Error('Could not parse date or series');
	const presenter = getPresenter(episode);
	const arithmetician = getArith(episode);
	const lexicographer = getLex(episode);
	const guest = getGuest(episode);
	const { player1, player2, p1Link, p2Link, p1Score, p2Score } = getPlayersAndWinner(episode, episodeNumber);
	const rounds = processRounds(episode, episodeNumber);
	if (episode.indexOf('Partial recap') > -1 || rounds.length < 9) {
		return false;
	}
	const episodeObject = {
		e: episodeNumber,
		d: firstShownDate,
		s: {
			n: seriesNumber,
			t: seriesType,
			l: seriesLink,
		},
		p1: {
			n: player1,
			s: p1Score,
			l: p1Link,
		},
		p2: {
			n: player2,
			s: p2Score,
			l: p2Link,
		},
		g: guest,
		l: lexicographer,
		r: rounds,
		p: presenter,
		a: arithmetician,
	};
	return episodeObject;
};

const parseEpisodes = (start = 1) => {
	const episodes = [];
	const errors = [];
	for (let i = start; i <= 1000000; i += 1) {
		let episode;

		try {
			episode = fs.readFileSync(fileFromNumber(i), 'utf8');
		} catch (err) {
			// run out of episodes
			break;
		}
		if (i === 2045) {
			continue; // episode pulled from schedule as contestant was a convicted child molester
		} else if (i === 5723) {
			continue; // episode pulled from schedule as contestant was a convicted teenager groomer
		} else if (i === 7290) {
			continue; // episode pulled from schedule as Nick said something which might have been covid insensitive
		} else if (i === 7779) {
			continue; // episode pulled from schedule for unknown reasons
		}
		try {
			const episodeObject = parseEpisode(episode, i);
			if (!episodeObject) continue;
			episodes.push(episodeObject);
		} catch (e) {
			errors.push(fileFromNumber(i));
			logMessage(`Error (${e}) parsing this episode (#${i}): ${episode}`);
		}
	}
	return { episodes, errors };
};

const getDateFromEpisode = (episodeId) => {
	const episode = fs.readFileSync(fileFromNumber(episodeId), 'utf8');
	const { firstShownDate } = getEpisodeDateAndSeries(episode, episodeId);
	return firstShownDate;
};

export { parseEpisode, parseEpisodes, getDateFromEpisode };
