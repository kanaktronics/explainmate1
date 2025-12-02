
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { CheckCircle, X } from "lucide-react";
import { useAppContext } from "@/lib/app-context";
import { Badge } from "./ui/badge";

interface AdPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdPopup({ isOpen, onClose }: AdPopupProps) {
  const { setView } = useAppContext();

  const handleUpgradeClick = () => {
    setView('pro-membership');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <Badge variant="destructive" className="mb-4 w-fit mx-auto bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 py-1 px-4 text-sm">Limited Time Offer</Badge>
          <DialogTitle className="text-center text-3xl font-headline text-primary">Upgrade to ExplainMate Pro</DialogTitle>
          <DialogDescription className="text-center text-lg">
            Unlock unlimited access and powerful features to supercharge your learning.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
            <div className="text-center mb-6">
                 <p className="text-4xl font-bold text-primary">₹99 <span className="text-xl font-normal text-muted-foreground">/ 2 months</span></p>
                 <p className="text-xl font-semibold text-muted-foreground line-through">₹359</p>
            </div>
            <ul className="space-y-3 text-base">
                <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span><span className="font-semibold">Unlimited</span> explanations & quizzes</span>
                </li>
                <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span><span className="font-semibold">Upload images</span> and diagrams for analysis</span>
                </li>
                <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Ask <span className="font-semibold">longer, more complex questions</span></span>
                </li>
                <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Choose the number of <span className="font-semibold">quiz questions (up to 15)</span></span>
                </li>
            </ul>
        </div>

        <DialogFooter className="sm:justify-center">
            <Button onClick={handleUpgradeClick} className="w-full text-lg py-6 bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 text-primary-foreground">
                Upgrade to Pro Now
            </Button>
        </DialogFooter>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
