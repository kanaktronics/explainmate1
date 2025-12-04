export function ServiceDeliveryPolicyView() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center space-y-4">
        <h1 className="text-5xl font-headline text-primary">Service Delivery (Digital Access) Policy</h1>
        <p className="text-lg text-muted-foreground">
          Last updated: [4/12/25]
        </p>
      </header>
      
      <div className="prose dark:prose-invert max-w-none text-lg space-y-6">
        <p>
          ExplainMate is a digital learning service by K&amp;D Labs, 
          entirely owned by Kanak Raj (Founder &amp; CEO).
        </p>

        <div>
          <h3 className="font-headline text-2xl text-primary">1. Delivery of Service</h3>
          <p>Access to ExplainMate is delivered digitally — no physical shipping.</p>
        </div>

        <div>
          <h3 className="font-headline text-2xl text-primary">2. Free Users</h3>
          <p>Free accounts get instant access after signup.</p>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">3. Paid Users</h3>
          <p>
            Pro features activate automatically after successful payment confirmation.  
            Minor delays (up to 30–60 minutes) may occur due to payment gateway processing.
          </p>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">4. Delivery Issues</h3>
          <p>
            If Pro is not activated after payment, contact us with your transaction details.
          </p>
        </div>

        <div>
          <h3 className="font-headline text-2xl text-primary">5. Downtime</h3>
          <p>
            Temporary maintenance or updates may cause short-term unavailability.
          </p>
        </div>
        
        <div>
          <h3 className="font-headline text-2xl text-primary">6. Support</h3>
          <p>
            For access issues: <br />
            Email — <a href="mailto:kdproductions.help@gmail.com">kdproductions.help@gmail.com</a> <br />
            Owned by — Kanak Raj, Founder &amp; CEO, K&amp;D Labs
          </p>
        </div>
      </div>
    </div>
  );
}
