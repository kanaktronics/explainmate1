import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Mail, Instagram } from "lucide-react";

export function ContactView() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center space-y-4">
        <h1 className="text-5xl font-headline text-primary">Contact Us</h1>
        <p className="text-xl text-muted-foreground">
            Got a doubt? Found a bug? Or just want to say “Hey, your AI saved my life before exams”?
        </p>
        <p className="text-lg">Whatever it is — we’re here for you. (Yes, even at 2 AM… students never sleep, we know.)</p>
      </header>
      
      <Card className="text-center">
        <CardHeader>
            <CardTitle className="text-3xl font-headline">Get in Touch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-primary">Email Us</h3>
                <p className="text-muted-foreground">For everything—questions, issues, feedback, life problems, or ranting about school:</p>
                <Button asChild variant="link" className="text-lg">
                    <a href="mailto:kdproductions.help@gmail.com">
                        <Mail className="mr-2"/> kdproductions.help@gmail.com
                    </a>
                </Button>
                <p className="text-sm text-muted-foreground">We usually reply fast. If not, we’re probably fixing something important… or eating Maggi.</p>
            </div>
            
            <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-primary">Follow Us</h3>
                <Button asChild variant="link" className="text-lg">
                    <a href="https://www.instagram.com/kanak_.raj" target="_blank" rel="noopener noreferrer">
                        <Instagram className="mr-2"/> @kanak_.raj
                    </a>
                </Button>
            </div>
        </CardContent>
      </Card>

      <div className="prose dark:prose-invert max-w-none text-lg space-y-4">
        <h3 className="font-headline text-2xl text-primary">What You Can Ask Us</h3>
        <ul>
            <li>“ExplainMate didn’t explain this properly”</li>
            <li>“My notes disappeared, help!”</li>
            <li>“Can you add this feature?”</li>
            <li>“I love the website, marry me—just kidding”</li>
            <li>“Why is maths so hard?” (we’ll try our best)</li>
        </ul>

        <h3 className="font-headline text-2xl text-primary">We Actually Read Your Emails</h3>
        <p>
            ExplainMate is built for students, so your messages matter a lot. Feedback = upgrades. Bugs = we squash them. Suggestions = we actually add them.
        </p>

        <h3 className="font-headline text-2xl text-primary">From Students, For Students</h3>
        <p>
            Don’t hesitate — send that email. We don’t judge. We just help.
        </p>
      </div>
    </div>
  );
}
