import { FileText } from "lucide-react";

export function TermsConditionsView() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center space-y-4">
        <h1 className="text-5xl font-headline text-primary">Terms & Conditions</h1>
        <p className="text-lg text-muted-foreground">
          Last updated: [4/12/25]
        </p>
      </header>
      
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
          <h3 className="font-headline text-2xl text-primary">5. Payments</h3>
          <p>
            Premium features (ExplainMate Pro) may require payment.
            Payments are handled securely via third-party gateways like Razorpay.
          </p>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">6. Intellectual Property</h3>
          <p>
            All ExplainMate content, branding, and underlying systems are owned by Kanak Raj (Founder & CEO, K&D Labs).
            You receive a limited personal licence to use the platform.
          </p>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">7. AI Content Accuracy</h3>
          <p>
            AI-generated content may contain inaccuracies.
            Verify important information before using it academically.
          </p>
        </div>

        <div>
          <h3 className="font-headline text-2xl text-primary">8. Limitation of Liability</h3>
          <p>K&D Labs is not liable for:</p>
          <ul>
            <li>Loss of marks</li>
            <li>Misunderstanding of AI outputs</li>
            <li>Indirect or incidental damages</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">9. Indemnification</h3>
          <p>
            You agree to indemnify K&D Labs and Kanak Raj against any misuse of the service.
          </p>
        </div>

        <div>
          <h3 className="font-headline text-2xl text-primary">10. Governing Law</h3>
          <p>
            These Terms follow Indian law.
            Any disputes fall under jurisdiction of courts near the residence of the owner (Kanak Raj).
          </p>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">11. Contact</h3>
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
