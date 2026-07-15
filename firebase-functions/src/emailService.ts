import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }
  return transporter;
}

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const transporterInstance = getTransporter();
  const mailOptions = {
    from: `"DORPTS" <${EMAIL_FROM}>`,
    to: email,
    subject: 'Your DORPTS Login OTP',
    text: `Your OTP for DORPTS login is: ${otp}\n\nThis code will expire in 10 minutes.`,
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
  };

  await transporterInstance.sendMail(mailOptions);
}
