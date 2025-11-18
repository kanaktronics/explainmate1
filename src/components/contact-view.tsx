import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Send } from "lucide-react";

export function ContactView() {
  return (
    <div className="max-w-2xl mx-auto">
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-4xl font-headline text-primary">Contact Us</CardTitle>
                <CardDescription className="text-lg">Have a question or feedback? We'd love to hear from you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="name">Name</label>
                    <Input id="name" placeholder="Your Name" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="email">Email</label>
                    <Input id="email" type="email" placeholder="your@email.com" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="message">Message</label>
                    <Textarea id="message" placeholder="Your message..." rows={6} />
                </div>
                <Button className="w-full">
                    <Send className="mr-2"/>
                    Send Message
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
