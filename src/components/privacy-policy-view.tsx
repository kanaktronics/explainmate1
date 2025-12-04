
export function PrivacyPolicyView({ inModal = false }: { inModal?: boolean }) {
  const Header = () => (
      <header className="text-center space-y-4">
        <h1 className="text-5xl font-headline text-primary">Privacy Policy</h1>
        <p className="text-lg text-muted-foreground">
          Last updated: [4/12/25]
        </p>
      </header>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {!inModal && <Header />}
      
      <div className="prose dark:prose-invert max-w-none text-lg space-y-6">
        <p>
          ExplainMate is an AI-powered learning platform fully owned and operated by K&amp;D Labs. 
          K&amp;D Labs is completely owned by Kanak Raj, Founder &amp; CEO, India.
        </p>
        <p>
          We are committed to protecting your privacy and ensuring the safe handling of your personal information. This Privacy Policy explains how we collect, use, and protect your data when you use ExplainMate.
        </p>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">1. Information We Collect</h3>
          <h4 className="font-semibold">1.1 Account Information</h4>
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Password (encrypted)</li>
            <li>School/grade (optional)</li>
          </ul>
          
          <h4 className="font-semibold mt-4">1.2 Usage Information</h4>
          <ul>
            <li>Pages visited and features used</li>
            <li>AI queries and learning interactions</li>
            <li>Device/browser details</li>
            <li>IP address (city/country level only)</li>
          </ul>

          <h4 className="font-semibold mt-4">1.3 Communication Data</h4>
          <ul>
            <li>Emails or messages sent to support</li>
            <li>Feedback or bug reports</li>
          </ul>
          <p>We DO NOT collect financial details, Aadhaar numbers, or other sensitive data.</p>
        </div>

        <div>
          <h3 className="font-headline text-2xl text-primary">2. How We Use Your Data</h3>
          <p>We use your information to:</p>
          <ul>
            <li>Provide ExplainMate’s learning features</li>
            <li>Personalise your learning experience</li>
            <li>Improve AI accuracy and platform quality</li>
            <li>Fix bugs and protect against misuse</li>
            <li>Communicate important updates</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">3. AI Processing</h3>
          <p>
            ExplainMate uses trusted AI model providers to generate responses.
            Avoid entering personal or sensitive information inside prompts.
          </p>
        </div>

        <div>
          <h3 className="font-headline text-2xl text-primary">4. Cookies</h3>
          <p>We use cookies to:</p>
          <ul>
            <li>Keep you logged in</li>
            <li>Remember preferences</li>
            <li>Analyse traffic</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">5. Data Sharing</h3>
          <p>
            We do NOT sell your data.
            We may share limited data with service providers (hosting, analytics, AI, payment gateway) strictly to run the platform.
          </p>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">6. Data Security</h3>
          <p>
            We use industry-standard security measures.
            However, no system is fully secure — keep your password safe.
          </p>
        </div>

        <div>
          <h3 className="font-headline text-2xl text-primary">7. Children’s Use</h3>
          <p>
            Users under 18 should use ExplainMate with parental/guardian guidance.
          </p>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">8. Your Rights</h3>
          <p>You may request:</p>
          <ul>
            <li>Data access</li>
            <li>Correction</li>
            <li>Deletion</li>
          </ul>
          <p>Contact: <a href="mailto:kdproductions.help@gmail.com">kdproductions.help@gmail.com</a></p>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">9. Changes</h3>
          <p>
            We may update this policy occasionally. Continued use means you accept the updated version.
          </p>
        </div>

        <div>
          <h3 className="font-headline text-2xl text-primary">10. Contact</h3>
          <p>
            K&amp;D Labs (ExplainMate)<br />
            Owned by Kanak Raj — Founder &amp; CEO<br />
            Email: <a href="mailto:kdproductions.help@gmail.com">kdproductions.help@gmail.com</a><br />
            India
          </p>
        </div>
      </div>
    </div>
  );
}
