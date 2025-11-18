import { LegalPageLayout } from '@/components/LegalPageLayout';

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="November 2025">
      <div className="space-y-4 text-sm">
        <p>
          This Privacy Policy explains how Zombify, operated by Nicholas Asher, trading as Zombify and based in South Africa ("we," "our," or "us"), collects, uses, and protects your Personal Information.
        </p>
        <p>
          By using Zombify, you agree to this Privacy Policy, which must be read together with our{' '}
          <a href="/terms" className="underline hover:opacity-70">Terms of Service</a>,{' '}
          <a href="/cookies" className="underline hover:opacity-70">Cookie Policy</a>, and{' '}
          <a href="/ai-disclaimer" className="underline hover:opacity-70">AI Disclaimer</a>.
        </p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">1. Who We Are</h3>
        <p>1.1 Operator: Nicholas Asher, trading as Zombify</p>
        <p>1.2 Location: South Africa</p>
        <p>1.3 Contact: hi@zombify.ai</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">2. Definition of Personal Information</h3>
        <p>2.1 "Personal Information" means information as defined under the Protection of Personal Information Act, 4 of 2013 ("POPI"), including information by which you can be identified, such as your name, address (including email), race, gender, and age.</p>
        <p>2.2 We will only collect Personal Information by lawful means and for a specific communicated purpose.</p>
        <p>2.3 We will process Personal Information only for the specific purpose for which it was collected.</p>
        <p>2.4 We will not sell, distribute, or disclose any Personal Information unless we have your consent or it is required or permitted by law.</p>
        <p>2.5 We will retain your Personal Information only as long as necessary to fulfil the purpose for which it was collected.</p>
        <p>2.6 You may request access to, or deletion of, your Personal Information by emailing hi@zombify.ai.</p>
        <p>2.7 Analytics data is anonymised or pseudonymised where possible.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">3. Information We Collect</h3>
        <p className="font-medium">3.1 Account Information</p>
        <p className="pl-4">a. Email address and password (for manual registration).</p>
        <p className="pl-4">b. Profile and authentication data from Google or Discord SSO.</p>
        <p className="pl-4">c. Optional marketing consent preference.</p>
        
        <p className="font-medium">3.2 Uploaded Content</p>
        <p className="pl-4">a. Images and related files you upload for AI analysis.</p>
        <p className="pl-4">b. Associated metadata and AI-generated results.</p>
        
        <p className="font-medium">3.3 Usage Data</p>
        <p className="pl-4">a. Analytics via PostHog and Vercel (page views, feature usage, and session events).</p>
        <p className="pl-4">b. Cookies and local storage for authentication, attribution, and session management.</p>
        <p className="pl-4">c. Device type, IP hash, and browser agent for abuse and rate-limit protection.</p>
        
        <p className="font-medium">3.4 Payment Data</p>
        <p className="pl-4">a. Payments are processed by Lemon Squeezy, which acts as Merchant of Record.</p>
        <p className="pl-4">b. Zombify does not store complete payment information or card data.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">4. Cookies and Tracking</h3>
        <p>4.1 We use cookies and local storage for:</p>
        <p className="pl-4">a. Authentication (Supabase) – necessary.</p>
        <p className="pl-4">b. Guest rate limiting – functional.</p>
        <p className="pl-4">c. Analytics (PostHog, Vercel) – optional.</p>
        <p className="pl-4">d. Attribution tracking – optional.</p>
        <p>4.2 You can reject non-essential cookies via the cookie banner.</p>
        <p>4.3 Refer to our <a href="/cookies" className="underline hover:opacity-70">Cookie Policy</a> for detailed information.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">5. How We Use Your Data</h3>
        <p>5.1 To provide account access and authentication.</p>
        <p>5.2 To process uploads and generate AI analyses.</p>
        <p>5.3 To communicate necessary account and system updates.</p>
        <p>5.4 To improve usability, quality, and performance of the Service.</p>
        <p>5.5 To monitor and prevent abuse or unauthorised use.</p>
        <p>5.6 We never sell Personal Information or AI-generated Data.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">6. Data Retention</h3>
        <p className="font-medium">6.1 Data Type | Retention Policy</p>
        <p className="pl-4">• Free user analyses – retain last ten (10), delete older automatically.</p>
        <p className="pl-4">• Pro user analyses – retain last sixty (60), delete older automatically.</p>
        <p className="pl-4">• Guest uploads – deleted daily if not linked to an account.</p>
        <p className="pl-4">• Rate limiting logs – retained for 24 hours.</p>
        <p className="pl-4">• View tracking logs – retained for 90 days.</p>
        <p className="pl-4">• UTM attribution data – retained for 90 days (browser only).</p>
        
        <p>6.2 When a User deletes their account, all related data is permanently erased from Zombify's database.</p>
        <p>6.3 Analytical and telemetry data may be retained in anonymised or aggregated form for statistical purposes.</p>
        <p>6.4 You may request deletion or access to your data by emailing hi@zombify.ai.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">7. AI Processing</h3>
        <p>7.1 Uploaded images and associated data are processed using OpenAI (GPT-5) and OCR systems for analysis generation.</p>
        <p>7.2 AI processing occurs solely to provide the Service you request.</p>
        <p>7.3 Zombify does not use uploaded content to train external AI systems.</p>
        <p>7.4 AI results are stored in your account and deleted according to your plan's retention limits.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">8. Legal Basis for Processing (GDPR Regions)</h3>
        <p>8.1 Performance of a contract – to deliver the Service you have requested.</p>
        <p>8.2 Legitimate interest – to maintain security, analytics, and product improvement.</p>
        <p>8.3 Consent – for cookies, analytics, and marketing communications.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">9. Data Sharing</h3>
        <p>9.1 We share limited data only with trusted service providers necessary for the operation of Zombify:</p>
        <p className="pl-4">a. Lemon Squeezy – for billing and invoicing.</p>
        <p className="pl-4">b. Supabase – for authentication and data storage.</p>
        <p className="pl-4">c. PostHog and Vercel – for analytics and performance monitoring.</p>
        <p>9.2 These providers are GDPR-compliant and implement secure, encrypted data handling.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">10. International Transfers and Data Breach Notification</h3>
        <p>10.1 Your Personal Information may be processed in or transferred to countries outside your country of residence.</p>
        <p>10.2 Where Personal Information is transferred outside South Africa, such transfer will comply with section 79 of POPI and ensure the recipient is subject to laws or binding agreements that provide adequate levels of data protection.</p>
        <p>10.3 In the event of a data breach that compromises your Personal Information, Zombify will notify you and the relevant data protection authority as required under POPI or applicable international law.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">11. User Rights</h3>
        <p>11.1 You have the right to:</p>
        <p className="pl-4">a. Access your Personal Information.</p>
        <p className="pl-4">b. Request correction or deletion of your data.</p>
        <p className="pl-4">c. Withdraw consent for analytics or marketing.</p>
        <p className="pl-4">d. Lodge a complaint with your local data authority.</p>
        
        <p>11.2 To exercise these rights, email hi@zombify.ai.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">12. Emails and Communication</h3>
        <p>12.1 Account, billing, and service-related emails are sent automatically as part of service delivery.</p>
        <p>12.2 Marketing or promotional emails are sent only where you have expressly opted in.</p>
        <p>12.3 All marketing emails contain an unsubscribe link.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">13. Children</h3>
        <p>13.1 Zombify is not directed to individuals under 18 years old.</p>
        <p>13.2 Users aged 16 to 17 may use the Service only with the consent of a parent or legal guardian.</p>
        <p>13.3 We do not knowingly collect or process Personal Information from anyone under 18 without such consent.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">14. Security</h3>
        <p>14.1 Data is encrypted in transit and at rest using Supabase infrastructure.</p>
        <p>14.2 Access to Personal Information is restricted to authorised personnel only.</p>
        <p>14.3 We use HTTPS, secure authentication, and other industry-standard protections.</p>
        <p>14.4 While we maintain appropriate safeguards, no system is completely secure, and use of the Service is at your own risk.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">15. Updates to This Policy</h3>
        <p>15.1 Zombify may update or amend this Privacy Policy periodically.</p>
        <p>15.2 If updates materially affect your rights or data usage, we will notify you by email or in-app notice before changes take effect.</p>
        <p>15.3 Continued use of the Service after such notice constitutes acceptance of the revised policy.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">16. Contact</h3>
        <p>For privacy or data-related matters, please contact:</p>
        <p>Email: <a href="mailto:hi@zombify.ai" className="underline hover:opacity-70">hi@zombify.ai</a></p>
      </div>
    </LegalPageLayout>
  );
}
