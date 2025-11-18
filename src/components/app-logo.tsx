import { BrainCircuit } from "lucide-react";

export const AppLogo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-primary p-2 rounded-lg">
        <BrainCircuit className="text-primary-foreground h-6 w-6" />
      </div>
      <h1 className="text-xl font-headline font-semibold text-foreground whitespace-nowrap">
        ExplainMate
      </h1>
    </div>
  );
};
