/**
 * TermsOfServicePage — Terms of Service
 * Issue #30: Legal Pages
 */
import React from 'react';
import { Shield, FileText, Scale, Clock, UserCheck, Building, AlertTriangle } from 'lucide-react';

const SECTIONS = [
  {
    icon: <UserCheck className="h-5 w-5" />,
    title: '1. Acceptance of Terms',
    body: `By accessing or using the LYC Intelligence platform ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. These terms apply to all users, including registered users, visitors, and clients.`,
  },
  {
    icon: <Building className="h-5 w-5" />,
    title: '2. Service Description',
    body: `LYC Intelligence provides executive search, leadership consulting, talent intelligence, and professional development services through a digital platform. The Service includes but is not limited to: candidate search tools, mandate management, learning content, coaching services, and intelligence reports. Services may be modified or discontinued at our discretion.`,
  },
  {
    icon: <UserCheck className="h-5 w-5" />,
    title: '3. User Accounts',
    body: `You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate and complete information during registration. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts for violation of these terms.`,
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: '4. Privacy & Data Protection',
    body: `Your use of the Service is also governed by our Privacy Policy. We implement appropriate technical and organizational measures to protect your personal data. By using the Service, you consent to the collection and use of information as described in our Privacy Policy.`,
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: '5. Intellectual Property',
    body: `All content on the Service, including text, graphics, logos, software, and methodologies, is the property of LYC Intelligence or its licensors and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our explicit written permission.`,
  },
  {
    icon: <Scale className="h-5 w-5" />,
    title: '6. User Conduct',
    body: `You agree not to: (a) use the Service for any unlawful purpose; (b) violate any applicable laws or regulations; (c) infringe on the rights of others; (d) attempt to gain unauthorized access to the Service; (e) interfere with the proper functioning of the Service; (f) upload or transmit malicious code; (g) use the Service to send unsolicited communications.`,
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: '7. Fees & Payment',
    body: `Certain services require payment of fees. All fees are in the currency specified at checkout and are non-refundable except as expressly stated. We reserve the right to change pricing upon reasonable notice. Late payments may result in service suspension. Subscription services auto-renew unless cancelled before the renewal date.`,
  },
  {
    icon: <AlertTriangle className="h-5 w-5" />,
    title: '8. Disclaimers',
    body: `The Service is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of any content or results. The Service should not be the sole basis for employment, career, or business decisions. We disclaim all implied warranties, including merchantability and fitness for a particular purpose.`,
  },
  {
    icon: <Scale className="h-5 w-5" />,
    title: '9. Limitation of Liability',
    body: `To the fullest extent permitted by law, LYC Intelligence shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability shall not exceed the amount paid by you, if any, for accessing the Service during the twelve months preceding the claim.`,
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: '10. Termination',
    body: `We may terminate or suspend your account and access to the Service immediately, without prior notice, for any breach of these Terms. Upon termination, your right to use the Service ceases immediately. Provisions that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.`,
  },
  {
    icon: <Scale className="h-5 w-5" />,
    title: '11. Governing Law',
    body: `These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which LYC Intelligence is registered, without regard to its conflict of law provisions. Any disputes shall be resolved through good faith negotiation or, failing that, through the courts of competent jurisdiction.`,
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: '12. Changes to Terms',
    body: `We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through a prominent notice on the Service. Your continued use of the Service after changes constitutes acceptance of the modified terms. Last updated: July 2026.`,
  },
];

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 text-[13px] text-[#6B6B6B] mb-2">
            <FileText className="h-4 w-4" />
            Legal
          </div>
          <h1 className="text-[36px] font-serif text-[#1A1A1A]">Terms of Service</h1>
          <p className="text-[14px] text-[#6B6B6B] mt-2">
            Last updated: July 2026
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
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

        <div className="mt-12 p-6 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
          <h3 className="text-[15px] font-medium text-[#1A1A1A] mb-2">Questions?</h3>
          <p className="text-[13px] text-[#6B6B6B]">
            If you have any questions about these Terms, please contact us at{' '}
            <a href="mailto:legal@lyc-intelligence.com" className="text-[#1A1A1A] underline">
              legal@lyc-intelligence.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
