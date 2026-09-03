import { jest } from '@jest/globals';
import { sendEmail } from '../src/email.js';

describe('email delivery', () => {
	afterEach(() => jest.restoreAllMocks());

	test('returns the provider response after successful delivery', async () => {
		jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Queued. Thank you.', { status: 200 }));

		await expect(
			sendEmail({ EMAILS_TO: 'owner@example.com', MAILGUN_API_KEY: 'secret' }, 'Test subject', 'Text', '<p>HTML</p>'),
		).resolves.toBe('Queued. Thank you.');
	});

	test('throws when Mailgun rejects a message', async () => {
		jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Forbidden', { status: 403 }));

		await expect(
			sendEmail({ EMAILS_TO: 'owner@example.com', MAILGUN_API_KEY: 'secret' }, 'Alert', 'Text', '<p>HTML</p>'),
		).rejects.toThrow('Mailgun rejected email "Alert": HTTP 403 Forbidden');
	});
});
