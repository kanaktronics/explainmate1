import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
      <WifiOff className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-4xl font-headline text-primary">You're Offline</h1>
      <p className="text-lg text-muted-foreground mt-2">
        It seems you've lost your connection. Please check your network and try again.
      </p>
      <p className="text-sm text-muted-foreground mt-8">
        Some pages may be available, but core functionality requires an internet connection.
      </p>
    </div>
  );
}
