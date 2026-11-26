import { useState, useCallback } from 'react';
import api from '../api/axios';

const STATUS_LABELS  = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };
const STATUS_CLASSES = { TODO: 'badge-todo', IN_PROGRESS: 'badge-inprogress', IN_REVIEW: 'badge-inreview', DONE: 'badge-done' };
const PRIORITY_COLORS = { LOW: 'var(--priority-low-text)', MEDIUM: 'var(--priority-medium-text)', HIGH: 'var(--priority-high-text)' };
const COLUMNS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

export default function KanbanView({ tasks, onTaskClick, onStatusChange }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col] = tasks.filter(t => t.status === col);
    return acc;
  }, {});

  const handleDragStart = useCallback((e, task) => {
    setDraggingId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', String(task.id));
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOver(null);
  }, []);

  const handleDragOver = useCallback((e, col) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(col);
  }, []);

  const handleDrop = useCallback(async (e, newStatus) => {
    e.preventDefault();
    const taskId = Number(e.dataTransfer.getData('taskId'));
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      await onStatusChange(taskId, newStatus);
    }
    setDraggingId(null);
    setDragOver(null);
  }, [tasks, onStatusChange]);

  return (
    <div className="kanban-board">
      {COLUMNS.map(col => (
        <div
          key={col}
          className={`kanban-col${dragOver === col ? ' drag-over' : ''}`}
          onDragOver={e => handleDragOver(e, col)}
          onDragLeave={() => setDragOver(null)}
          onDrop={e => handleDrop(e, col)}
        >
          <div className="kanban-col__header">
            <span className={`kanban-col__title badge ${STATUS_CLASSES[col]}`}>
              {STATUS_LABELS[col]}
            </span>
            <span className="kanban-col__count">{tasksByStatus[col].length}</span>
          </div>

          {tasksByStatus[col].map(task => (
            <div
              key={task.id}
              className={`kanban-card${draggingId === task.id ? ' dragging' : ''}`}
              draggable
              onDragStart={e => handleDragStart(e, task)}
              onDragEnd={handleDragEnd}
              onClick={() => onTaskClick(task)}
            >
              <div className="kanban-card__title">{task.title}</div>
              <div className="kanban-card__meta">
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)'
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {task.dueDate}
                  </span>
                )}
                {task.projectName && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-disabled)', background: 'var(--color-border)', borderRadius: 'var(--radius-full)', padding: '1px 6px' }}>
                    {task.projectName}
                  </span>
                )}
              </div>
            </div>
          ))}

          {tasksByStatus[col].length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)', color: 'var(--color-text-disabled)', fontSize: 'var(--text-xs)' }}>
              Drop here
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
