interface NotificationEmailProps {
  firstName: string;
  subject: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

export const newCandidateEmail = ({ firstName, actionUrl }: NotificationEmailProps) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Candidate Submitted</title>
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
    <div class="title">New Candidate Submitted</div>
    <div class="body">
      Hi ${firstName},<br><br>
      A new candidate has been submitted for your review. Click below to view the candidate profile.
    </div>
    <a href="${actionUrl}" class="button">View Candidate</a>
    <div class="footer">
      © 2024 LYC Intelligence. All rights reserved.<br>
      ${process.env.NEXT_PUBLIC_APP_URL}
    </div>
  </div>
</body>
</html>
`;

export const statusUpdateEmail = ({ firstName, message, actionUrl }: NotificationEmailProps) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Status Update</title>
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
    <div class="title">Application Status Update</div>
    <div class="body">
      Hi ${firstName},<br><br>
      ${message}
    </div>
    <a href="${actionUrl}" class="button">View Details</a>
    <div class="footer">
      © 2024 LYC Intelligence. All rights reserved.<br>
      ${process.env.NEXT_PUBLIC_APP_URL}
    </div>
  </div>
</body>
</html>
`;

export const weeklyDigestEmail = ({ firstName, message }: NotificationEmailProps) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Intelligence Digest</title>
  <style>
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F7F7F7; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 48px; box-shadow: 0 4px 24px rgba(28, 28, 28, 0.06); }
    .logo { font-size: 24px; font-weight: 700; color: #C108AB; margin-bottom: 32px; }
    .title { font-size: 28px; font-weight: 700; color: #1C1C1C; margin-bottom: 16px; line-height: 1.3; }
    .body { font-size: 16px; color: #666666; line-height: 1.75; margin-bottom: 32px; }
    .highlight { background: rgba(193, 8, 171, 0.04); padding: 16px; border-radius: 8px; margin-bottom: 16px; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #E5E5E5; font-size: 12px; color: #999999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">LYC Intelligence</div>
    <div class="title">Your Weekly Intelligence Digest</div>
    <div class="body">
      Hi ${firstName},<br><br>
      Here's your weekly summary of key updates and insights:
    </div>
    <div class="highlight">
      ${message}
    </div>
    <div class="footer">
      © 2024 LYC Intelligence. All rights reserved.<br>
      ${process.env.NEXT_PUBLIC_APP_URL}
    </div>
  </div>
</body>
</html>
`;