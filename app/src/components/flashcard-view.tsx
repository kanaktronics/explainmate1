'use client';

import * as React from 'react';
import { useAppContext } from '@/lib/app-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

function RevisionCard({ content }: { content: string }) {
  return (
    <Card className="flex flex-col items-center justify-center w-full h-full min-h-[300px]">
      <CardContent className="p-6">
        <div className="prose dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {content}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}


export function FlashcardView() {
  const { flashcards, clearFlashcards } = useAppContext();

  const isOpen = !!flashcards && flashcards.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && clearFlashcards()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Revision Cards</DialogTitle>
          <DialogDescription>
            Key points from the explanation for quick revision.
          </DialogDescription>
        </DialogHeader>
        <div className="p-8">
            <Carousel opts={{ loop: true }} className="w-full">
                <CarouselContent>
                    {flashcards && flashcards.length > 0 ? (
                        flashcards.map((card, index) => (
                            <CarouselItem key={index}>
                                <div className="p-1">
                                    <RevisionCard content={card.content} />
                                </div>
                            </CarouselItem>
                        ))
                    ) : (
                        <CarouselItem>
                            <div className="flex items-center justify-center p-6 text-muted-foreground">
                                No revision cards were generated.
                            </div>
                        </CarouselItem>
                    )}
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
