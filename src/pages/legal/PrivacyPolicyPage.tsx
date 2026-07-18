/**
 * PrivacyPolicyPage — Privacy Policy
 * Issue #30: Legal Pages
 */
import React from 'react';
import {
  Shield,
  User,
  Database,
  Eye,
  Lock,
  Share2,
  Globe,
  Clock,
  FileText,
  AlertTriangle,
  Mail,
  Trash2,
} from 'lucide-react';

const SECTIONS = [
  {
    icon: <User className="h-5 w-5" />,
    title: '1. Information We Collect',
    body: `We collect information you provide directly: name, email, phone number, company, job title, and account credentials. We also collect information automatically: IP address, browser type, device information, usage patterns, and page views. Additionally, we collect professional information including resume data, career history, and assessment results relevant to our services.`,
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: '2. How We Use Your Information',
    body: `We use your information to: provide and improve our services; process transactions; communicate with you about services, updates, and opportunities; personalize your experience; ensure platform security and prevent fraud; analyze usage patterns; and comply with legal obligations. We do not sell your personal data to third parties for commercial purposes.`,
  },
  {
    icon: <Share2 className="h-5 w-5" />,
    title: '3. Information Sharing',
    body: `We may share your information with: (a) client organizations you have explicitly applied to or expressed interest in, with your consent; (b) service providers who assist our operations (e.g., cloud hosting, payment processing, email delivery) under confidentiality obligations; (c) law enforcement when required by law or to protect our rights; (d) in connection with a business transfer such as a merger or acquisition.`,
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: '4. Data Security',
    body: `We implement industry-standard security measures including encryption in transit (TLS 1.3), encryption at rest (AES-256), regular security audits, access controls, and secure authentication protocols. While we strive to protect your data, no method of transmission over the Internet is 100% secure. We maintain incident response procedures and will notify affected users of breaches as required by law.`,
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: '5. Your Rights & Choices',
    body: `You have the right to: access, correct, or update your personal information; request deletion of your data (subject to legal retention requirements); object to or restrict certain data processing; export your data in a portable format; withdraw consent where processing is based on consent; and opt out of marketing communications at any time. To exercise these rights, contact us at privacy@lyc-intelligence.com.`,
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: '6. International Data Transfers',
    body: `Your information may be transferred to and processed in countries other than your own. We ensure such transfers comply with applicable data protection laws through appropriate safeguards, including Standard Contractual Clauses and data processing agreements with third-party service providers.`,
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: '7. Cookies & Tracking',
    body: `We use cookies and similar tracking technologies to enhance your experience, analyze usage, and deliver relevant content. Cookie categories include: essential (required for service operation), analytical (usage statistics), functional (preference remembering), and marketing (advertising). You can control cookie preferences through your browser settings. For more details, see our Cookie Policy.`,
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: '8. Data Retention',
    body: `We retain your personal data for as long as necessary to provide our services and fulfill the purposes outlined in this policy. Retention periods vary by data type: account data (duration of account plus legal retention period), candidate data (up to 5 years unless deletion requested), communications (up to 7 years for compliance), and analytics data (up to 3 years aggregated).`,
  },
  {
    icon: <User className="h-5 w-5" />,
    title: '9. Children\'s Privacy',
    body: `Our Service is not intended for children under 16 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete such information promptly. If you believe we have collected information from a child, please contact us.`,
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: '10. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of material changes by posting a notice on our website or sending an email to the address associated with your account. Your continued use of the Service after changes become effective constitutes acceptance of the updated policy. Last updated: July 2026.`,
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: '11. Contact Us',
    body: `For questions about this Privacy Policy, our data practices, or to exercise your rights, contact our Data Protection Officer at: privacy@lyc-intelligence.com or LYC Intelligence, Data Protection Office, Shanghai, China. We respond to requests within 30 days of receipt.`,
  },
];

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 text-[13px] text-[#6B6B6B] mb-2">
            <Shield className="h-4 w-4" />
            Legal
          </div>
          <h1 className="text-[36px] font-serif text-[#1A1A1A]">Privacy Policy</h1>
          <p className="text-[14px] text-[#6B6B6B] mt-2">
            Last updated: July 2026
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-5 mb-8">
          <p className="text-[14px] text-[#4A4A4A] leading-relaxed">
            At LYC Intelligence, we take your privacy seriously. This policy describes what
            personal information we collect, how we use it, and your rights regarding your data.
            We are committed to processing your data lawfully, fairly, and transparently.
          </p>
        </div>

        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title} className="pb-6 border-b border-[#F0F0F0] last:border-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-[#1A1A1A]">{section.icon}</div>
                <h2 className="text-[18px] font-serif text-[#1A1A1A]">{section.title}</h2>
              </div>
              <p className="text-[14px] text-[#4A4A4A] leading-relaxed">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-10">
          <div className="p-4 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
            <Shield className="h-6 w-6 text-[#1A1A1A] mb-2" />
            <h4 className="text-[14px] font-medium text-[#1A1A1A] mb-1">Secure & Encrypted</h4>
            <p className="text-[12px] text-[#6B6B6B]">TLS 1.3 + AES-256 at rest</p>
          </div>
          <div className="p-4 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
            <Trash2 className="h-6 w-6 text-[#1A1A1A] mb-2" />
            <h4 className="text-[14px] font-medium text-[#1A1A1A] mb-1">Right to Delete</h4>
            <p className="text-[12px] text-[#6B6B6B]">Request data deletion anytime</p>
          </div>
          <div className="p-4 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
            <Mail className="h-6 w-6 text-[#1A1A1A] mb-2" />
            <h4 className="text-[14px] font-medium text-[#1A1A1A] mb-1">DPO Contact</h4>
            <p className="text-[12px] text-[#6B6B6B]">privacy@lyc-intelligence.com</p>
          </div>
        </div>
      </main>
    </div>
  );
}
