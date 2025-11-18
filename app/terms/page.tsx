import { LegalPageLayout } from '@/components/LegalPageLayout';

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="November 2025">
      <div className="space-y-4 text-sm">
        <p>
          These Terms of Service ("Terms") govern your access to and use of Zombify, operated by Nicholas Asher, trading as Zombify, based in South Africa ("we," "our," or "us").
        </p>
        <p>
          By accessing or using the Service, you ("User") agree to be bound by these Terms together with our{' '}
          <a href="/privacy" className="underline hover:opacity-70">Privacy Policy</a>,{' '}
          <a href="/cookies" className="underline hover:opacity-70">Cookie Policy</a>, and{' '}
          <a href="/ai-disclaimer" className="underline hover:opacity-70">AI Disclaimer</a>, which are incorporated herein by reference.
        </p>
        <p className="font-medium">
          If you do not agree, do not use the Service.
        </p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">1. Definitions</h3>
        <p>1.1 "Service" refers to the Zombify web platform that provides AI-generated design feedback and analysis for uploaded user interfaces.</p>
        <p>1.2 "User" means any person who accesses, views, registers, uploads, or otherwise uses the Service, including guests and viewers of shared analyses.</p>
        <p>1.3 "Personal Information" means any information that can identify a User, such as name, email address, or password, as defined under the Protection of Personal Information Act (POPIA) and equivalent data laws.</p>
        <p>1.4 "Data" means AI-generated content or output created by the Zombify system, distinct from a User's Personal Information.</p>
        <p>1.5 "Business Days" means any day other than a Saturday, Sunday, or South African public holiday.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">2. Service Overview</h3>
        <p>2.1 Zombify provides AI-generated analysis and feedback for uploaded user interfaces.</p>
        <p>2.2 The Service includes free and paid subscription plans, accessible globally via web browsers.</p>
        <p>2.3 Features and limits may vary by plan and are subject to change at our discretion.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">3. Accounts and Access</h3>
        <p>3.1 To use the Service, the User must be at least 18 years old or otherwise legally recognised as a major.</p>
        <p>3.2 Users aged 16 to 17 who are not majors may only use the Service with the consent of a parent or legal guardian.</p>
        <p>3.3 Accounts may be created using email/password or third-party authentication (e.g. Google, Discord, Figma).</p>
        <p>3.4 The User is responsible for keeping account credentials secure and confidential.</p>
        <p>3.5 Guest uploads may be available without registration but are subject to limited access and automatic pruning.</p>
        <p>3.6 We may suspend or terminate accounts engaged in abuse, illegal activity, or policy violations.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">4. Plans and Payments</h3>
        <p>4.1 Payments are processed by Lemon Squeezy, which acts as the Merchant of Record.</p>
        <p>4.2 Available plans include Free, Pro Monthly, and Pro Annual subscriptions.</p>
        <p>4.3 Free plans provide limited analyses and storage; Pro plans unlock extended limits and features.</p>
        <p>4.4 Subscriptions renew automatically unless cancelled through the User's Lemon Squeezy account.</p>
        <p>4.5 All sales are final. Refunds are granted only if Zombify fails to deliver paid features within seven (7) days of purchase.</p>
        <p>4.6 If a User has an active subscription, account deletion is blocked until the subscription is cancelled to prevent further billing.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">5. User Content</h3>
        <p>5.1 The User retains ownership of all images and materials uploaded to the Service.</p>
        <p>5.2 By uploading, the User grants Zombify a limited licence to process, analyse, and display the content for the purpose of providing the Service.</p>
        <p>5.3 The User must not upload unlawful, copyrighted, or confidential materials that they do not own or have rights to use.</p>
        <p>5.4 Zombify is not responsible for Personal Information that Users may include in uploaded images.</p>
        <p>5.5 Public sharing is optional and can be toggled within account settings.</p>
        <p>5.6 The User is solely responsible for the content uploaded and any resulting consequences.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">6. Data Storage and Retention</h3>
        <p>6.1 Free Users: the last ten (10) analyses are retained.</p>
        <p>6.2 Pro Users: the last sixty (60) analyses are retained.</p>
        <p>6.3 Older analyses are deleted automatically and cannot be recovered.</p>
        <p>6.4 Guest uploads are pruned daily if not linked to an account.</p>
        <p>6.5 When a User deletes their account, all data linked to that account is permanently erased from Zombify's database.</p>
        <p>6.6 Analytical and telemetry data may be retained in anonymised or aggregated form for statistical or service improvement purposes.</p>
        <p>6.7 Data deletion requests may be submitted to hi@zombify.ai.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">7. Prohibited Usage</h3>
        <p>7.1 The User agrees not to:</p>
        <p className="pl-4">a. Upload illegal, harmful, or offensive material.</p>
        <p className="pl-4">b. Use the Service to train or develop external AI systems.</p>
        <p className="pl-4">c. Attempt to disrupt, reverse-engineer, or exploit any part of the Service.</p>
        <p>7.2 Zombify reserves the right to suspend or terminate any account engaging in abuse, illegal activity, or any conduct violating these Terms or other policies.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">8. AI Output Disclaimer</h3>
        <p>8.1 Zombify's feedback is generated automatically and is provided for informational purposes only.</p>
        <p>8.2 It does not constitute professional design, business, or legal advice.</p>
        <p>8.3 Use of AI insights and recommendations is entirely at the User's own risk.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">9. Intellectual Property</h3>
        <p>9.1 Zombify owns all Service code, algorithms, branding, and design elements.</p>
        <p>9.2 Users may freely use AI outputs and insights, including for commercial purposes.</p>
        <p>9.3 No rights or ownership are granted over Zombify's internal systems, trademarks, or brand assets.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">10. Limitation of Liability and Force Majeure</h3>
        <p>10.1 The Service is provided "as is" without warranties of any kind.</p>
        <p>10.2 To the fullest extent permitted by law, Zombify shall not be liable for any indirect, incidental, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill.</p>
        <p>10.3 Zombify's total liability shall not exceed the amount paid, if any, by the User for the most recent billing cycle.</p>
        <p>10.4 Force Majeure: Zombify shall not be liable for delays, interruptions, or failures resulting from causes beyond its reasonable control, including acts of God, natural disasters, government actions, wars, civil disturbances, strikes, internet outages, or third-party system failures.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">11. Termination and Account Deletion</h3>
        <p>11.1 Zombify may suspend or terminate User access for violations, abuse, or misuse of the Service.</p>
        <p>11.2 Users may cancel their subscription through Lemon Squeezy and request account deletion via their dashboard.</p>
        <p>11.3 Account deletion is blocked if an active subscription exists. Once cancelled, all account data is permanently deleted.</p>
        <p>11.4 Zombify does not retain any Personal Information after deletion, except as required by law or third-party processors (e.g. Lemon Squeezy) for tax and compliance purposes.</p>
        <p>11.5 Once deleted, User data cannot be recovered.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">12. Email Communication</h3>
        <p>12.1 Account, billing, and product update emails are automatically sent as part of service delivery.</p>
        <p>12.2 Marketing emails are sent only to Users who have expressly opted in.</p>
        <p>12.3 Users may unsubscribe at any time via email links or account settings.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">13. Jurisdiction</h3>
        <p>13.1 These Terms shall be governed by and construed in accordance with the laws of the Republic of South Africa.</p>
        <p>13.2 The parties consent to the exclusive jurisdiction of the courts of the Republic of South Africa regarding any dispute, claim, or matter arising from or connected with these Terms, their interpretation, validity, enforceability, or termination.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">14. Contact</h3>
        <p>For legal, data, or support matters:</p>
        <p>Email: <a href="mailto:hi@zombify.ai" className="underline hover:opacity-70">hi@zombify.ai</a></p>
      </div>
    </LegalPageLayout>
  );
}
