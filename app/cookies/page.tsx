import { LegalPageLayout } from '@/components/LegalPageLayout';

export default function CookiesPage() {
  return (
    <LegalPageLayout title="Cookie Policy" lastUpdated="November 2025">
      <div className="space-y-4 text-sm">
        <p>
          This Cookie Policy explains how Zombify, operated by Nicholas Asher, trading as Zombify, based in South Africa ("we," "our," or "us"), uses cookies and similar technologies to ensure the proper functioning of our platform, analyze usage, and improve user experience.
        </p>
        <p>
          This policy complies with the Protection of Personal Information Act, 4 of 2013 ("POPI") and the Electronic Communications and Transactions Act, 25 of 2002 ("ECTA"), which require user consent for storing or accessing information on a user's device.
        </p>
        <p>
          By using Zombify, you agree to this Cookie Policy, which should be read together with our{' '}
          <a href="/terms" className="underline hover:opacity-70">Terms of Service</a>,{' '}
          <a href="/privacy" className="underline hover:opacity-70">Privacy Policy</a>, and{' '}
          <a href="/ai-disclaimer" className="underline hover:opacity-70">AI Disclaimer</a>.
        </p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">1. What Are Cookies</h3>
        <p>1.1 Cookies are small text files stored on your device when you visit our site.</p>
        <p>1.2 They help us remember your session, preferences, and activity to provide a consistent experience.</p>
        <p>1.3 Some cookies are necessary for the platform to function, while others are optional and require your consent.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">2. Types of Cookies We Use</h3>
        <div className="overflow-x-auto my-4">
          <table className="w-full border-collapse border border-black/20 text-sm">
            <thead>
              <tr className="bg-black/5">
                <th className="border border-black/20 p-2 text-left font-bold">Type</th>
                <th className="border border-black/20 p-2 text-left font-bold">Purpose</th>
                <th className="border border-black/20 p-2 text-left font-bold">Examples</th>
                <th className="border border-black/20 p-2 text-left font-bold">Consent Required</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black/20 p-2 font-medium">Strictly Necessary</td>
                <td className="border border-black/20 p-2">Required for authentication, security, and basic functionality.</td>
                <td className="border border-black/20 p-2">Supabase auth cookies, rate-limit tokens</td>
                <td className="border border-black/20 p-2">❌ No</td>
              </tr>
              <tr>
                <td className="border border-black/20 p-2 font-medium">Functional</td>
                <td className="border border-black/20 p-2">Support optional features such as guest uploads and remembering preferences.</td>
                <td className="border border-black/20 p-2">z_guest_used, zombify_session</td>
                <td className="border border-black/20 p-2">⚙️ No</td>
              </tr>
              <tr>
                <td className="border border-black/20 p-2 font-medium">Analytics</td>
                <td className="border border-black/20 p-2">Help us understand user behavior and improve Zombify.</td>
                <td className="border border-black/20 p-2">PostHog cookies, Vercel Analytics</td>
                <td className="border border-black/20 p-2">✅ Yes</td>
              </tr>
              <tr>
                <td className="border border-black/20 p-2 font-medium">Attribution</td>
                <td className="border border-black/20 p-2">Track UTM campaign data in localStorage to measure marketing performance.</td>
                <td className="border border-black/20 p-2">zombify:attr</td>
                <td className="border border-black/20 p-2">✅ Yes</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">3. LocalStorage</h3>
        <p>3.1 Zombify also uses browser localStorage for:</p>
        <p className="pl-4">a. Storing user preferences and attribution data.</p>
        <p className="pl-4">b. Managing cookie consent state.</p>
        <p className="pl-4">c. Controlling guest upload limits.</p>
        <p>3.2 LocalStorage data remains on your device and can be cleared anytime via your browser settings.</p>
        <p>3.3 Clearing localStorage may reset preferences and limit saved functionality.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">4. Managing Cookies</h3>
        <p>4.1 When you first visit Zombify, you will see a cookie banner that allows you to:</p>
        <p className="pl-4">a. Accept all cookies – Enables analytics and attribution tracking.</p>
        <p className="pl-4">b. Reject non-essential cookies – Only necessary and functional cookies remain active.</p>
        <p>4.2 Rejecting non-essential cookies may limit certain functionality of the Service.</p>
        <p>4.3 You can change or withdraw consent at any time through your account settings or by clearing cookies in your browser.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">5. Third-Party Cookies</h3>
        <p>5.1 We use trusted third parties to deliver essential services:</p>
        <p className="pl-4">a. Supabase – for authentication and data storage.</p>
        <p className="pl-4">b. PostHog – for anonymised analytics and event tracking.</p>
        <p className="pl-4">c. Vercel – for site performance and request metrics.</p>
        <p className="pl-4">d. Lemon Squeezy – for secure payment processing (may set short-lived session cookies during checkout).</p>
        <p>5.2 Each provider maintains its own privacy policy governing cookie use and complies with applicable data-protection laws.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">6. Duration</h3>
        <div className="overflow-x-auto my-4">
          <table className="w-full border-collapse border border-black/20 text-sm">
            <thead>
              <tr className="bg-black/5">
                <th className="border border-black/20 p-2 text-left font-bold">Cookie Type</th>
                <th className="border border-black/20 p-2 text-left font-bold">Typical Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black/20 p-2">Necessary</td>
                <td className="border border-black/20 p-2">Session-based</td>
              </tr>
              <tr>
                <td className="border border-black/20 p-2">Functional</td>
                <td className="border border-black/20 p-2">24 hours</td>
              </tr>
              <tr>
                <td className="border border-black/20 p-2">Analytics</td>
                <td className="border border-black/20 p-2">Up to 1 year (PostHog default)</td>
              </tr>
              <tr>
                <td className="border border-black/20 p-2">Attribution</td>
                <td className="border border-black/20 p-2">90 days (stored locally)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>6.1 Durations may vary based on your browser and settings.</p>
        <p>6.2 You may delete cookies manually at any time.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">7. Do Not Track</h3>
        <p>7.1 If your browser sends a "Do Not Track" signal, Zombify respects that preference and automatically disables analytics initialization.</p>
        <p>7.2 However, strictly necessary cookies required for core functionality will remain active.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">8. Updates to This Policy</h3>
        <p>8.1 We may modify this Cookie Policy periodically to reflect platform or legal updates.</p>
        <p>8.2 Any significant changes will be published on this page with a revised "last updated" date.</p>
        <p>8.3 Continued use of the Service after updates constitutes acceptance of the revised policy.</p>

        <div className="border-t border-black/20 my-6"></div>

        <h3 className="font-bold text-base">9. Contact</h3>
        <p>For any questions about cookies, consent, or privacy:</p>
        <p>Email: <a href="mailto:hi@zombify.ai" className="underline hover:opacity-70">hi@zombify.ai</a></p>
      </div>
    </LegalPageLayout>
  );
}

