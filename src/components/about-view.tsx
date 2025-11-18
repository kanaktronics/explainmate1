import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function AboutView() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center space-y-4">
        <h1 className="text-5xl font-headline text-primary">About ExplainMate</h1>
        <p className="text-xl text-muted-foreground">
          Simplifying education, one explanation at a time.
        </p>
      </header>

      <Card>
        <CardHeader className="items-center">
            <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src="https://api.dicebear.com/8.x/thumbs/svg?seed=Kanak" />
                <AvatarFallback>KR</AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl font-headline">Meet the Founder</CardTitle>
        </CardHeader>
        <CardContent className="text-lg text-center">
            <p className="font-semibold text-primary text-2xl">Kanak Raj</p>
            <p className="text-muted-foreground">14-Year-Old Visionary & AI Innovator</p>
        </CardContent>
      </Card>
      
      <div className="prose dark:prose-invert max-w-none text-lg">
        <p>
          <strong>Kanak Raj</strong> is the visionary 14-year-old founder behind ExplainMate, an AI-powered learning platform designed to simplify education for students of all levels. Despite his young age, Kanak has built a reputation as one of the most promising young innovators in AI, robotics, and educational technology.
        </p>

        <h3 className="font-headline text-2xl text-primary">The Belief Behind ExplainMate</h3>
        <p>
          Kanak created ExplainMate with a strong belief: <strong>students don’t need more difficulty — they need clearer explanations.</strong> He noticed that many learners struggle not because concepts are hard, but because they aren’t explained in a way that truly connects. With this mission, he developed ExplainMate as an intelligent tool that breaks down complex school chapters and concepts, providing not just answers, but also rough work, fair-work examples, and quizzes to ensure true understanding. The platform reflects Kanak’s deep empathy for how students think and where they commonly face confusion.
        </p>

        <h3 className="font-headline text-2xl text-primary">A Prolific Builder</h3>
        <p>
          Alongside ExplainMate, Kanak is also the founder of <strong>MechMateAI</strong>, where he builds advanced AI assistants, robotics systems, and full-stack projects. His impressive hands-on experience includes:
        </p>
        <ul>
            <li>AI-based learning assistants</li>
            <li>ESP32/Arduino robotics systems</li>
            <li>E-commerce platforms</li>
            <li>Game development (Roblox, Unreal Engine, C++)</li>
            <li>Educational automation tools</li>
            <li>Advanced coding and hardware integration</li>
        </ul>

        <h3 className="font-headline text-2xl text-primary">The Mission</h3>
        <p>
          Even at 14, Kanak’s work stands out for its clarity, innovation, and real-world usefulness. ExplainMate is not just a project — it’s his commitment to improving how students learn across India. The goal is simple: <strong>to make ExplainMate the most reliable study partner for every student who wants to understand, learn faster, and achieve more.</strong>
        </p>
      </div>
    </div>
  );
}
