import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const client = getResendClient();

  const { error } = await client.emails.send({
    from: 'DORPTS <onboarding@resend.dev>',
    to: email,
    subject: 'Your DORPTS Login OTP',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
        <h2 style="color: #0099DA; margin-bottom: 16px;">DORPTS Login Verification</h2>
        <p style="font-size: 14px; line-height: 1.6;">Your one-time password (OTP) for logging into DORPTS is:</p>
        <div style="background: #f3f4f6; border: 2px dashed #0099DA; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0099DA;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #6b7280;">This code will expire in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || 'Failed to send OTP email');
  }
}
