interface EmailTemplateProps {
  firstName: string;
  companyName?: string;
  actionUrl?: string;
  expirationDate?: string;
}

export const welcomeEmail = ({ firstName }: EmailTemplateProps) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to LYC Intelligence</title>
  <style>
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F7F7F7; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 48px; box-shadow: 0 4px 24px rgba(28, 28, 28, 0.06); }
    .logo { font-size: 24px; font-weight: 700; color: #C108AB; margin-bottom: 32px; }
    .title { font-size: 28px; font-weight: 700; color: #1C1C1C; margin-bottom: 16px; line-height: 1.3; }
    .body { font-size: 16px; color: #666666; line-height: 1.75; margin-bottom: 32px; }
    .button { display: inline-block; padding: 12px 32px; background: #C108AB; color: white; text-decoration: none; border-radius: 0; font-weight: 600; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #E5E5E5; font-size: 12px; color: #999999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">LYC Intelligence</div>
    <div class="title">Welcome, ${firstName}!</div>
    <div class="body">
      Thank you for joining LYC Intelligence. We're excited to help you find your next transformational leader.
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Access Your Dashboard</a>
    <div class="footer">
      © 2024 LYC Intelligence. All rights reserved.<br>
      ${process.env.NEXT_PUBLIC_APP_URL}
    </div>
  </div>
</body>
</html>
`;

export const passwordResetEmail = ({ firstName, actionUrl, expirationDate }: EmailTemplateProps) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F7F7F7; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 48px; box-shadow: 0 4px 24px rgba(28, 28, 28, 0.06); }
    .logo { font-size: 24px; font-weight: 700; color: #C108AB; margin-bottom: 32px; }
    .title { font-size: 28px; font-weight: 700; color: #1C1C1C; margin-bottom: 16px; line-height: 1.3; }
    .body { font-size: 16px; color: #666666; line-height: 1.75; margin-bottom: 32px; }
    .button { display: inline-block; padding: 12px 32px; background: #C108AB; color: white; text-decoration: none; border-radius: 0; font-weight: 600; }
    .warning { font-size: 14px; color: #EF4444; margin-top: 16px; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #E5E5E5; font-size: 12px; color: #999999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">LYC Intelligence</div>
    <div class="title">Reset Your Password</div>
    <div class="body">
      Hi ${firstName},<br><br>
      We received a request to reset your password. Click the button below to set a new password.
    </div>
    <a href="${actionUrl}" class="button">Reset Password</a>
    <div class="warning">
      This link expires in 1 hour (${expirationDate}). If you didn't request this, please ignore this email.
    </div>
    <div class="footer">
      © 2024 LYC Intelligence. All rights reserved.<br>
      ${process.env.NEXT_PUBLIC_APP_URL}
    </div>
  </div>
</body>
</html>
`;

export const invitationEmail = ({ firstName, companyName, actionUrl }: EmailTemplateProps) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join LYC Intelligence</title>
  <style>
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F7F7F7; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 48px; box-shadow: 0 4px 24px rgba(28, 28, 28, 0.06); }
    .logo { font-size: 24px; font-weight: 700; color: #C108AB; margin-bottom: 32px; }
    .title { font-size: 28px; font-weight: 700; color: #1C1C1C; margin-bottom: 16px; line-height: 1.3; }
    .body { font-size: 16px; color: #666666; line-height: 1.75; margin-bottom: 32px; }
    .button { display: inline-block; padding: 12px 32px; background: #C108AB; color: white; text-decoration: none; border-radius: 0; font-weight: 600; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #E5E5E5; font-size: 12px; color: #999999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">LYC Intelligence</div>
    <div class="title">You're Invited to Join ${companyName}</div>
    <div class="body">
      Hi ${firstName},<br><br>
      You've been invited to join ${companyName} on LYC Intelligence. Click below to accept the invitation and get started.
    </div>
    <a href="${actionUrl}" class="button">Accept Invitation</a>
    <div class="footer">
      © 2024 LYC Intelligence. All rights reserved.<br>
      ${process.env.NEXT_PUBLIC_APP_URL}
    </div>
  </div>
</body>
</html>
`;