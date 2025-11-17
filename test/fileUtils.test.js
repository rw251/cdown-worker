import { mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirFromNumber, fileFromNumber, removeFiles } from '../src/fileUtils.js';
import { getMessages, initLog } from '../src/log.js';

const srcDir = fileURLToPath(new URL('../src', import.meta.url));
const episodesDir = join(srcDir, '..', '..', '..', 'public_html', 'cdown', 'episodes');

describe('file utils', () => {
	beforeEach(() => {
		initLog();
	});

	test('dirFromNumber builds nested directory path', () => {
		const expected = join(episodesDir, '8000', '8100', '8150');
		expect(dirFromNumber(8156)).toBe(expected);
	});

	test('fileFromNumber builds nested file path', () => {
		const expected = join(episodesDir, '8000', '8100', '8150', '8156.txt');
		expect(fileFromNumber(8156)).toBe(expected);
	});

	test('removeFiles unlinks files and logs action', () => {
		const scratchDir = mkdtempSync(join(tmpdir(), 'fileutils-'));
		const first = join(scratchDir, 'one.txt');
		const second = join(scratchDir, 'two.txt');
		writeFileSync(first, '1');
		writeFileSync(second, '2');

		removeFiles([first, second]);

		expect(existsSync(first)).toBe(false);
		expect(existsSync(second)).toBe(false);
		expect(getMessages()).toBe(`Removing the following as they error'd: ${first}, ${second}`);

		rmSync(scratchDir, { recursive: true, force: true });
	});
});
