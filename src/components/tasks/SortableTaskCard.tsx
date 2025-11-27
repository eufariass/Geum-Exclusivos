import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types';
import { TaskCard } from './TaskCard';

interface SortableTaskCardProps {
  task: Task;
  onEdit?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
}

export const SortableTaskCard = ({ task, onEdit, onComplete, onDelete }: SortableTaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onEdit={onEdit}
        onComplete={onComplete}
        onDelete={onDelete}
        isDragging={isDragging}
      />
    </div>
  );
};
