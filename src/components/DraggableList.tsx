import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface DraggableItem {
  id: string;
  content: React.ReactNode;
}

export interface DraggableListProps {
  items: DraggableItem[];
  onReorder?: (items: DraggableItem[]) => void;
  className?: string;
  dragHandle?: boolean;
}

export function DraggableList({
  items,
  onReorder,
  className,
  dragHandle = true,
}: DraggableListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overIndex !== index) {
      setOverIndex(index);
    }
  }, [overIndex]);

  const handleDragLeave = useCallback(() => {
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      setOverIndex(null);
    }
  }, []);

  const handleDragEnter = useCallback(() => {
    dragCounter.current += 1;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setOverIndex(null);
      return;
    }

    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);
    onReorder?.(newItems);
    setDraggedIndex(null);
    setOverIndex(null);
    dragCounter.current = 0;
  }, [items, draggedIndex, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setOverIndex(null);
    dragCounter.current = 0;
  }, []);

  return (
    <ul className={cn('flex flex-col gap-1', className)} role="list">
      {items.map((item, index) => (
        <li
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDragEnter={handleDragEnter}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={cn(
            'flex items-center gap-2 px-3 py-3 bg-white border border-[var(--echo-border-default)]',
            'transition-all duration-150 cursor-grab active:cursor-grabbing',
            draggedIndex === index && 'opacity-50 scale-95',
            overIndex === index && draggedIndex !== index && 'border-[var(--echo-accent)] bg-[var(--echo-accent-soft)]',
          )}
          aria-label={`Draggable item ${index + 1}`}
        >
          {dragHandle && (
            <span
              className="text-[var(--echo-text-muted)] cursor-grab active:cursor-grabbing"
              aria-hidden="true"
              title="Drag to reorder"
            >
              ⋮⋮
            </span>
          )}
          <div className="flex-1">{item.content}</div>
        </li>
      ))}
    </ul>
  );
}
