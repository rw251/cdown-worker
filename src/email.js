const SENDER = 'Cdown <cdown@rw251.com>';
const DOMAIN = 'mg.rw251.com';

const constructEmail = (to, subject, text, html) => {
	const form = new FormData();
	form.append('from', SENDER);
	form.append('to', to);
	form.append('subject', subject);
	form.append('text', text);
	form.append('html', html);
	return form;
};

async function sendEmail(env, subject, text, html) {
	const message = constructEmail(env.EMAILS_TO, subject, text, html);
	const authKey = btoa(`api:${env.MAILGUN_API_KEY}`);
	return fetch(`https://api.mailgun.net/v3/${DOMAIN}/messages`, {
		headers: {
			Authorization: `Basic ${authKey}`,
		},
		method: 'POST',
		body: message,
	}).then((x) => x.text());
}

export { sendEmail };
