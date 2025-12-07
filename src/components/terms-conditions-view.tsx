
export function TermsConditionsView({ inModal = false }: { inModal?: boolean }) {
  const Header = () => (
    <header className="text-center space-y-4">
        <h1 className="text-5xl font-headline text-primary">Terms & Conditions</h1>
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
          ExplainMate is owned entirely by K&D Labs, which is completely owned by 
          Kanak Raj (Founder & CEO). By using ExplainMate, you agree to the following Terms.
        </p>

        <div>
          <h3 className="font-headline text-2xl text-primary">1. Eligibility</h3>
          <p>Users must be 13+ or use the service under parental/guardian supervision.</p>
        </div>

        <div>
          <h3 className="font-headline text-2xl text-primary">2. Service Description</h3>
          <p>
            ExplainMate provides AI-generated explanations, examples, learning tools, and quizzes for educational support.
            AI output may not always be 100% accurate.
          </p>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">3. No Misuse</h3>
          <p>You agree NOT to:</p>
          <ul>
            <li>Use ExplainMate for cheating in exams</li>
            <li>Abuse or exploit the AI</li>
            <li>Attempt hacking or reverse engineering</li>
            <li>Upload harmful or illegal content</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">4. Accounts</h3>
          <p>
            You must use accurate information.
            We may suspend accounts violating our Terms.
          </p>
        </div>

        <div>
            <h3 className="font-headline text-2xl text-primary">5. Fair Usage Policy (FUP)</h3>
            <p>
              ExplainMate Pro offers “unlimited questions and quizzes” for genuine study and normal
              human learning patterns. To ensure platform stability, protect system resources, and
              maintain a high-quality learning experience for all users, ExplainMate applies a Fair
              Usage Policy.
            </p>
            <h4 className="font-semibold">5.1 Purpose of Fair Usage</h4>
            <p>
              This policy exists solely to prevent automated misuse, scripted attacks, abnormal
              usage spikes, or behavior that is not consistent with real student learning. It does
              NOT exist to limit or restrict genuine learners.
            </p>
            <h4 className="font-semibold">5.2 What “Unlimited” Means</h4>
            <p>
              “Unlimited” refers to unlimited normal study usage. Genuine students should never feel
              limited during regular or even heavy learning sessions. However, ExplainMate may apply
              soft limits when usage becomes extremely high in a way that resembles automation,
              botting, or abuse.
            </p>
            <h4 className="font-semibold">5.3 Examples of Abusive or Unusual Usage</h4>
             <p>The system may temporarily limit usage if patterns such as the following are detected:</p>
            <ul>
                <li>Extremely rapid, repeated requests within a short period</li>
                <li>Very large numbers of requests in one day beyond typical human capability</li>
                <li>Automated or scripted behavior</li>
                <li>Attempts to overload the service or bypass limits</li>
            </ul>
            <h4 className="font-semibold">5.4 Temporary Slow-Downs</h4>
            <p>If unusual activity is detected, ExplainMate may:</p>
             <ul>
                <li>Ask the user to slow down</li>
                <li>Temporarily pause their ability to send new requests</li>
                <li>Reset their usage window after a short break</li>
            </ul>
            <p>These protections ensure stable performance for all students.</p>
            <h4 className="font-semibold">5.5 Account Suspension</h4>
            <p>
              ExplainMate reserves the right to temporarily or permanently suspend any account that:
            </p>
            <ul>
                <li>Attempts to bypass the Fair Usage Policy</li>
                <li>Uses automation, bots, or scripts</li>
                <li>Misuses the platform in a way that threatens stability</li>
            </ul>
            <p>Serious or repeated misuse may result in account termination without refund.</p>
            <h4 className="font-semibold">5.6 Real Learners Are Always Prioritized</h4>
            <p>
                If a genuine Pro student ever reaches the soft usage limits due to extended study,
                ExplainMate will gladly review and, if appropriate, unlock additional usage upon
                request. Limits are never intended to block legitimate learning.
            </p>
            <p>By using ExplainMate Pro, you agree to this Fair Usage Policy.</p>
        </div>


        <div>
          <h3 className="font-headline text-2xl text-primary">6. Payments</h3>
          <p>
            Premium features (ExplainMate Pro) may require payment.
            Payments are handled securely via third-party gateways like Razorpay.
          </p>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">7. Intellectual Property</h3>
          <p>
            All ExplainMate content, branding, and underlying systems are owned by Kanak Raj (Founder & CEO, K&D Labs).
            You receive a limited personal licence to use the platform.
          </p>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">8. AI Content Accuracy</h3>
          <p>
            AI-generated content may contain inaccuracies.
            Verify important information before using it academically.
          </p>
        </div>

        <div>
          <h3 className="font-headline text-2xl text-primary">9. Limitation of Liability</h3>
          <p>K&D Labs is not liable for:</p>
          <ul>
            <li>Loss of marks</li>
            <li>Misunderstanding of AI outputs</li>
            <li>Indirect or incidental damages</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">10. Indemnification</h3>
          <p>
            You agree to indemnify K&D Labs and Kanak Raj against any misuse of the service.
          </p>
        </div>

        <div>
          <h3 className="font-headline text-2xl text-primary">11. Governing Law</h3>
          <p>
            These Terms follow Indian law.
            Any disputes fall under jurisdiction of courts near the residence of the owner (Kanak Raj).
          </p>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">12. Contact</h3>
          <p>
            K&D Labs — ExplainMate<br />
            Owned by Kanak Raj, Founder & CEO<br />
            Email: <a href="mailto:kdproductions.help@gmail.com">kdproductions.help@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
