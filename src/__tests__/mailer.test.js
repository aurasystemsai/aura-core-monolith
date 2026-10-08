const mockSend = jest.fn(async () => ({ messageId: '<m1>' }));
const mockCreate = jest.fn(() => ({ sendMail: mockSend }));
jest.mock('nodemailer', () => ({ createTransport: (o) => mockCreate(o) }));

describe('mailer', () => {
  afterEach(() => { ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'DKIM_DOMAIN', 'DKIM_SELECTOR', 'DKIM_PRIVATE_KEY', 'RESEND_API_KEY'].forEach((k) => delete process.env[k]); mockCreate.mockClear(); mockSend.mockClear(); });

  it('is a dry run with nothing configured', async () => {
    const { sendEmail, isConfigured } = require('../core/mailer');
    expect(isConfigured()).toBe(false);
    expect(await sendEmail({ to: 'a@b.co', subject: 's', html: 'h' })).toMatchObject({ sent: false, dryRun: true });
  });

  it('sends through SMTP with DKIM when configured', async () => {
    Object.assign(process.env, { SMTP_HOST: 'mail.example.com', SMTP_PORT: '465', SMTP_USER: 'u', SMTP_PASS: 'p', DKIM_DOMAIN: 'example.com', DKIM_SELECTOR: 'aura', DKIM_PRIVATE_KEY: 'KEY' });
    const { sendEmail } = require('../core/mailer');
    const r = await sendEmail({ to: 'a@b.co', subject: 'Hi', html: '<p>x</p>', replyTo: 'r@b.co' });
    expect(r).toMatchObject({ sent: true, id: '<m1>' });
    expect(mockCreate.mock.calls[0][0]).toMatchObject({ host: 'mail.example.com', port: 465, secure: true, auth: { user: 'u', pass: 'p' }, dkim: { domainName: 'example.com', keySelector: 'aura' } });
    expect(mockSend.mock.calls[0][0]).toMatchObject({ to: 'a@b.co', subject: 'Hi', replyTo: 'r@b.co' });
  });

  it('turns a mail server failure into a 502', async () => {
    process.env.SMTP_HOST = 'mail.example.com';
    mockSend.mockRejectedValueOnce(new Error('connection refused'));
    const { sendEmail } = require('../core/mailer');
    await expect(sendEmail({ to: 'a@b.co', subject: 's', html: 'h' })).rejects.toMatchObject({ status: 502 });
  });
});