'use client';

import * as React from 'react';
import { useAppContext } from '@/lib/app-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

function Flashcard({ front, back }: { front: string; back: string }) {
  const [isFlipped, setIsFlipped] = React.useState(false);

  return (
    <div className="perspective-1000 w-full h-full">
      <div
        className={cn(
          "relative w-full h-full text-center transition-transform duration-700 transform-style-3d",
          isFlipped ? 'rotate-y-180' : ''
        )}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front of the card */}
        <div className="absolute w-full h-full backface-hidden">
          <Card className="flex flex-col items-center justify-center w-full h-full min-h-[300px] cursor-pointer">
            <CardContent className="p-6">
              <div className="text-xl font-semibold">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{front}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Back of the card */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <Card className="flex flex-col items-center justify-center w-full h-full min-h-[300px] cursor-pointer bg-muted">
            <CardContent className="p-6">
              <div className="prose dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{back}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


export function FlashcardView() {
  const { flashcards, clearFlashcards } = useAppContext();

  const isOpen = !!flashcards && flashcards.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && clearFlashcards()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Revision Flashcards</DialogTitle>
          <DialogDescription>
            Click a card to flip it. Use the arrows to navigate through your generated flashcards.
          </DialogDescription>
        </DialogHeader>
        <div className="p-8">
            <Carousel opts={{ loop: true }} className="w-full">
                <CarouselContent>
                    {flashcards?.map((card, index) => (
                        <CarouselItem key={index}>
                            <div className="p-1">
                                <Flashcard front={card.front} back={card.back} />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>
        </div>
         <DialogClose asChild>
            <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
