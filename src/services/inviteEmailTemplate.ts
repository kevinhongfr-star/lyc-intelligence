/**
 * #1325 — Branded assessment invite email template.
 *
 * Generates a premium HTML email string for a consultant-sent assessment
 * invitation. Follows brand rules:
 *   • Zero border radius everywhere
 *   • System serif (DejaVu Serif / Georgia / Times) for headings, DM Sans for body, IBM Plex Mono for labels
 *   • Single accent color #C108AB (crimson)
 *   • No "free" — uses "complimentary"; entry tier is "Executive Introduction"
 *   • Premium tone (not SaaS): generous whitespace, mono labels with wide
 *     letter-spacing, serif headings at large sizes
 *
 * Used by the QuickAssignAssessment flow when a consultant sends an invite.
 */

export interface AssessmentInviteEmailParams {
  /** Full name of the LYC consultant sending the invite. */
  consultantName: string;
  /** Display name of the assessment instrument (e.g. "CPI", "SHIFT"). */
  assessmentName: string;
  /** Candidate's name (optional — falls back to a neutral greeting). */
  candidateName?: string;
  /** One-line value proposition: what the candidate walks away with. */
  assessmentValue?: string;
  /** Why the consultant selected this candidate. */
  selectionReason?: string;
  /** Destination URL for the primary CTA button. */
  ctaUrl: string;
  /** Short assessment code shown as a mono label (e.g. "CPI-2026"). */
  assessmentCode?: string;
}

const ACCENT = '#C108AB';
const ACCENT_HOVER = '#A00790';
const INK = '#0A0A12';
const TEXT_SECONDARY = '#2B2B3A';
const MUTED = '#616170';
const BORDER = '#E9E7E1';
const BG_ALT = '#F7F6F3';

const FONT_HEADING = "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif";
const FONT_BODY = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO = "'IBM Plex Mono', 'SF Mono', Menlo, Consolas, 'Courier New', monospace";

/**
 * Escape user-supplied text so it is safe to interpolate into HTML.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate a fully self-contained, branded HTML email body for an assessment
 * invitation. Returns an HTML string (no <html>/<body> wrapper — caller can
 * wrap as needed for the email provider).
 */
export function generateAssessmentInviteHTML(
  params: AssessmentInviteEmailParams,
): string {
  const {
    consultantName,
    assessmentName,
    candidateName,
    assessmentValue,
    selectionReason,
    ctaUrl,
    assessmentCode,
  } = params;

  const safeConsultant = escapeHtml(consultantName || 'Your LYC advisor');
  const safeAssessment = escapeHtml(assessmentName || 'your assessment');
  const safeCandidate = candidateName ? escapeHtml(candidateName) : '';
  const safeValue = assessmentValue
    ? escapeHtml(assessmentValue)
    : 'A personalized leadership profile, calibrated to where you are in your executive journey — delivered with the discretion a transition deserves.';
  const safeReason = selectionReason
    ? escapeHtml(selectionReason)
    : 'Your background stood out to us as a strong fit for the kind of leader this instrument is designed to serve.';
  const safeCta = escapeHtml(ctaUrl || '#');
  const safeCode = assessmentCode ? escapeHtml(assessmentCode) : '';

  const greeting = safeCandidate
    ? `Dear ${safeCandidate},`
    : 'A personal invitation,';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${safeConsultant} has invited you to ${safeAssessment}</title>
  <!--[if mso]>
  <style>
    .mono { font-family: 'Courier New', monospace !important; }
    .serif { font-family: Georgia, 'Times New Roman', serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#FFFFFF; font-family:${FONT_BODY}; color:${INK}; -webkit-font-smoothing:antialiased;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all; font-size:1px; line-height:1px; color:#FFFFFF;">
    ${safeConsultant} at LYC Intelligence has selected you for a complimentary ${safeAssessment} assessment.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFFFF;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Outer container — zero border radius, single hairline border -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#FFFFFF; border:1px solid ${BORDER};">

          <!-- Brand header -->
          <tr>
            <td style="padding:28px 40px; border-bottom:1px solid ${BORDER};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:${FONT_HEADING}; font-size:20px; font-weight:700; color:${INK}; letter-spacing:-0.01em;">
                    LYC Intelligence
                  </td>
                  <td align="right" class="mono" style="font-family:${FONT_MONO}; font-size:10px; font-weight:600; color:${MUTED}; letter-spacing:0.24em; text-transform:uppercase;">
                    Personal Invitation
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Accent rule -->
          <tr>
            <td style="background-color:${ACCENT}; height:3px; line-height:3px; font-size:3px;">&nbsp;</td>
          </tr>

          <!-- Eyebrow / assessment code -->
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <div class="mono" style="font-family:${FONT_MONO}; font-size:10px; font-weight:700; color:${ACCENT}; letter-spacing:0.26em; text-transform:uppercase;">
                ${safeAssessment}${safeCode ? ` &middot; ${safeCode}` : ''}
              </div>
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="padding:14px 40px 0 40px;">
              <h1 style="margin:0; font-family:${FONT_HEADING}; font-size:32px; line-height:1.16; font-weight:700; color:${INK}; letter-spacing:-0.015em;">
                A complimentary assessment,<br />selected for you.
              </h1>
            </td>
          </tr>

          <!-- Greeting + intro -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <p style="margin:0 0 16px 0; font-family:${FONT_BODY}; font-size:15px; line-height:1.65; color:${TEXT_SECONDARY};">
                ${greeting}
              </p>
              <p style="margin:0 0 16px 0; font-family:${FONT_BODY}; font-size:15px; line-height:1.65; color:${TEXT_SECONDARY};">
                I&rsquo;m ${safeConsultant}, and I work with executive leaders at LYC Intelligence. Based on your trajectory, I&rsquo;d like to extend a complimentary invitation to complete <strong style="color:${INK}; font-weight:600;">${safeAssessment}</strong> &mdash; one of the instruments in our eleven-part leadership catalog.
              </p>
            </td>
          </tr>

          <!-- "What you'll receive" panel -->
          <tr>
            <td style="padding:8px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BG_ALT}; border:1px solid ${BORDER};">
                <tr>
                  <td style="padding:24px 28px;">
                    <div class="mono" style="font-family:${FONT_MONO}; font-size:10px; font-weight:700; color:${ACCENT}; letter-spacing:0.22em; text-transform:uppercase; margin-bottom:10px;">
                      What you&rsquo;ll receive
                    </div>
                    <p style="margin:0; font-family:${FONT_BODY}; font-size:14px; line-height:1.65; color:${TEXT_SECONDARY};">
                      ${safeValue}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- "Why you were selected" -->
          <tr>
            <td style="padding:20px 40px 0 40px;">
              <div class="mono" style="font-family:${FONT_MONO}; font-size:10px; font-weight:700; color:${MUTED}; letter-spacing:0.22em; text-transform:uppercase; margin-bottom:8px;">
                Why you
              </div>
              <p style="margin:0; font-family:${FONT_BODY}; font-size:14px; line-height:1.65; color:${TEXT_SECONDARY};">
                ${safeReason}
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:32px 40px 8px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:${ACCENT};">
                    <a href="${safeCta}"
                       target="_blank"
                       rel="noopener noreferrer"
                       style="display:inline-block; padding:16px 36px; font-family:${FONT_BODY}; font-size:13px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:#FFFFFF; text-decoration:none; background-color:${ACCENT}; border:1px solid ${ACCENT};">
                      Begin ${safeAssessment}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 40px 8px 40px;">
              <p style="margin:0; font-family:${FONT_MONO}; font-size:10px; color:${MUTED}; letter-spacing:0.14em; text-transform:uppercase;">
                Complimentary &middot; No card required
              </p>
            </td>
          </tr>

          <!-- Consultant sign-off -->
          <tr>
            <td style="padding:28px 40px 0 40px; border-top:1px solid ${BORDER};">
              <p style="margin:0 0 4px 0; font-family:${FONT_BODY}; font-size:14px; line-height:1.6; color:${TEXT_SECONDARY};">
                Should you have any questions before you begin, simply reply to this email &mdash; it reaches me directly.
              </p>
              <p style="margin:16px 0 2px 0; font-family:${FONT_HEADING}; font-size:17px; font-weight:600; color:${INK};">
                ${safeConsultant}
              </p>
              <p style="margin:0; font-family:${FONT_MONO}; font-size:10px; color:${MUTED}; letter-spacing:0.16em; text-transform:uppercase;">
                LYC Intelligence &middot; Executive Advisory
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px 40px; background-color:${BG_ALT}; border-top:1px solid ${BORDER};">
              <p style="margin:0 0 6px 0; font-family:${FONT_MONO}; font-size:9px; color:${MUTED}; letter-spacing:0.18em; text-transform:uppercase;">
                Executive Introduction &middot; Confidential by default
              </p>
              <p style="margin:0; font-family:${FONT_BODY}; font-size:11px; line-height:1.6; color:${MUTED};">
                You received this invitation because ${safeConsultant} selected you for a complimentary ${safeAssessment} assessment. If this was sent in error, you may disregard it.
              </p>
            </td>
          </tr>

        </table>

        <!-- Below-container fine print -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
          <tr>
            <td align="center" style="padding:20px 16px 0 16px;">
              <p style="margin:0; font-family:${FONT_MONO}; font-size:9px; color:${MUTED}; letter-spacing:0.16em; text-transform:uppercase;">
                &copy; LYC Intelligence
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Generate a short, plain-text fallback for email clients that do not render
 * HTML. Keeps the same premium tone and key details.
 */
export function generateAssessmentInviteText(
  params: AssessmentInviteEmailParams,
): string {
  const {
    consultantName,
    assessmentName,
    candidateName,
    assessmentValue,
    ctaUrl,
  } = params;

  const name = candidateName ? candidateName : 'there';
  const value = assessmentValue
    ? assessmentValue
    : 'A personalized leadership profile, calibrated to where you are in your executive journey.';

  return [
    `Dear ${name},`,
    ``,
    `I'm ${consultantName}, and I work with executive leaders at LYC Intelligence.`,
    `Based on your trajectory, I'd like to extend a complimentary invitation to`,
    `complete ${assessmentName} — one of the instruments in our eleven-part`,
    `leadership catalog.`,
    ``,
    `What you'll receive:`,
    value,
    ``,
    `Begin your assessment here:`,
    ctaUrl,
    ``,
    `Complimentary. No card required.`,
    ``,
    `Should you have any questions, simply reply to this email — it reaches me`,
    `directly.`,
    ``,
    `Warm regards,`,
    `${consultantName}`,
    `LYC Intelligence · Executive Advisory`,
  ].join('\n');
}

export default generateAssessmentInviteHTML;
