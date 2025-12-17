
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MindMapNode {
  content: string;
  children: MindMapNode[];
}

// Function to parse markdown list into a tree structure
const parseMarkdownToTree = (markdown: string): MindMapNode | null => {
  if (!markdown) return null;

  const lines = markdown.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return null;

  const getIndentLevel = (line: string) => (line.match(/^\s*/)?.[0].length || 0) / 2;

  const root: MindMapNode = { content: 'root', children: [] };
  const nodeStack: (MindMapNode | null)[] = [root];

  for (const line of lines) {
    const level = getIndentLevel(line);
    const content = line.trim().replace(/^- \s*/, '').replace(/\*\*/g, '');

    const newNode: MindMapNode = { content, children: [] };

    // Go up the stack to find the correct parent
    while (level < nodeStack.length - 1 && nodeStack.length > 1) {
      nodeStack.pop();
    }

    if (nodeStack[nodeStack.length - 1]) {
      nodeStack[nodeStack.length - 1]!.children.push(newNode);
    }
    
    nodeStack.push(newNode);
  }

  // The actual root is the first child of our temporary root
  return root.children[0] || null;
};

// Recursive component to render the mind map
const MindMapNodeComponent = ({ node, level = 0 }: { node: MindMapNode, level?: number }) => {
  const levelStyles = [
    { bg: 'bg-primary', text: 'text-primary-foreground', padding: 'p-4', shape: 'rounded-xl' },
    { bg: 'bg-secondary', text: 'text-secondary-foreground', padding: 'p-3', shape: 'rounded-lg' },
    { bg: 'bg-muted', text: 'text-muted-foreground', padding: 'p-2', shape: 'rounded-md' },
    { bg: 'bg-muted/50', text: 'text-muted-foreground', padding: 'p-2', shape: 'rounded-md' },
  ];

  const style = levelStyles[Math.min(level, levelStyles.length - 1)];

  return (
    <div className="flex flex-col items-center">
      <div className={cn('shadow-md text-center', style.bg, style.text, style.padding, style.shape)}>
        <p className={cn('font-semibold', level === 0 ? 'text-lg' : 'text-sm')}>{node.content}</p>
      </div>

      {node.children.length > 0 && (
        <div className="flex justify-center gap-4 mt-8 relative">
          {/* Connecting lines */}
          <div className="absolute top-[-1rem] h-4 w-px bg-border -z-10" style={{ height: '1rem' }}></div>
          {node.children.map((_, index) => (
             <div key={index} className="absolute top-[-1rem] h-4 border-t border-l border-r border-border -z-10" style={{ 
                 width: '100%',
                 left: `${(index - (node.children.length-1)/2) * 100/node.children.length}%`,
                 transform: 'translateX(-50%)',
             }}/>
          ))}


          {node.children.map((child, index) => (
            <div key={index} className="relative pt-8 flex-1">
               <div className="absolute top-0 left-1/2 w-px h-8 bg-border -z-10" />
               <MindMapNodeComponent node={child} level={level + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export const MindMapView = ({ markdown }: { markdown: string }) => {
  const mindMapTree = React.useMemo(() => parseMarkdownToTree(markdown), [markdown]);

  if (!mindMapTree) {
    return <p className="text-muted-foreground">Mind map could not be generated.</p>;
  }

  return (
    <div className="flex justify-center p-4 overflow-x-auto">
      <div className="inline-block min-w-full">
        <MindMapNodeComponent node={mindMapTree} />
      </div>
    </div>
  );
};
