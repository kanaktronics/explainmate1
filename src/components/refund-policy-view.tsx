export function RefundPolicyView() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center space-y-4">
        <h1 className="text-5xl font-headline text-primary">Refund &amp; Cancellation Policy</h1>
        <p className="text-lg text-muted-foreground">
          Last updated: [4/12/25]
        </p>
      </header>
      
      <div className="prose dark:prose-invert max-w-none text-lg space-y-6">
        <p>
          ExplainMate is a digital service by K&amp;D Labs, fully owned by Kanak Raj (Founder &amp; CEO).
        </p>

        <div>
          <h3 className="font-headline text-2xl text-primary">1. Digital Nature</h3>
          <p>ExplainMate provides online educational tools. No physical items are shipped.</p>
        </div>

        <div>
          <h3 className="font-headline text-2xl text-primary">2. Purchases</h3>
          <p>Premium features may be accessed through paid plans.</p>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">3. Refund Eligibility</h3>
          <p>Refunds may be given ONLY if:</p>
          <ul>
            <li>You were charged but Pro was not activated</li>
            <li>A duplicate transaction occurred</li>
            <li>Severe technical issues prevented platform usage (proved)</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">4. Non-Refundable Situations</h3>
          <p>Refunds are NOT given for:</p>
          <ul>
            <li>Change of mind</li>
            <li>AI answer dissatisfaction</li>
            <li>Network/device issues on user side</li>
            <li>Account misuse leading to suspension</li>
          </ul>
        </div>

        <div>
          <h3 className="font-headline text-2xl text-primary">5. Refund Method</h3>
          <p>
            Approved refunds will be sent back to the original payment method in 7–10 business days.
          </p>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">6. Contact</h3>
          <p>
            K&amp;D Labs (ExplainMate)<br />
            Owned by Kanak Raj — Founder &amp; CEO<br />
            Email: <a href="mailto:kdproductions.help@gmail.com">kdproductions.help@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
