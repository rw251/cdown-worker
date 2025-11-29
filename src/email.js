const SENDER = 'Cdown <cdown@rw251.com>';
const DOMAIN = 'mg.rw251.com';

const wrapHtml = (subject, bodyHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);padding:24px 32px;border-radius:8px 8px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">📺 ${escapeHtml(subject)}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px 32px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #eee;">
              <p style="margin:0;color:#999;font-size:12px;">Countdown Worker • ${new Date().toUTCString()}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const escapeHtml = (str) =>
	String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

const constructEmail = (to, subject, text, html) => {
	const form = new FormData();
	form.append('from', SENDER);
	form.append('to', to);
	form.append('subject', subject);
	form.append('text', text);
	form.append('html', wrapHtml(subject, html));
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
