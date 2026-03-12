'use client';

import { useState, useEffect, useCallback } from 'react';

interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditModalState {
  open: boolean;
  todo: Todo | null;
  title: string;
  description: string;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    todo: null,
    title: '',
    description: '',
  });
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const fetchTodos = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to fetch todos');
      const data: Todo[] = await res.json();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDescription || undefined }),
      });
      if (!res.ok) throw new Error('Failed to create todo');
      const created: Todo = await res.json();
      setTodos((prev) => [created, ...prev]);
      setNewTitle('');
      setNewDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add todo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    const optimisticTodos = todos.map((t) =>
      t.id === todo.id ? { ...t, completed: !t.completed } : t
    );
    setTodos(optimisticTodos);
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (!res.ok) throw new Error('Failed to update todo');
      const updated: Todo = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setTodos(todos);
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  };

  const handleDelete = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    setDeleteConfirm(null);
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete todo');
    } catch (err) {
      await fetchTodos();
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  };

  const openEditModal = (todo: Todo) => {
    setEditModal({
      open: true,
      todo,
      title: todo.title,
      description: todo.description || '',
    });
  };

  const closeEditModal = () => {
    setEditModal({ open: false, todo: null, title: '', description: '' });
  };

  const handleEditSave = async () => {
    if (!editModal.todo || !editModal.title.trim()) return;
    try {
      const res = await fetch(`/api/todos/${editModal.todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editModal.title,
          description: editModal.description || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to update todo');
      const updated: Todo = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      closeEditModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  };

  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = todos.filter((t) => !t.completed).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>✓ Todo App</h1>
          <p style={styles.headerSubtitle}>Stay organized and productive</p>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{todos.length}</span>
            <span style={styles.statLabel}>Total</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNumber, color: '#3b82f6' }}>{activeCount}</span>
            <span style={styles.statLabel}>Active</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNumber, color: '#10b981' }}>{completedCount}</span>
            <span style={styles.statLabel}>Done</span>
          </div>
        </div>

        {/* Add Todo Form */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Add New Todo</h2>
          <form onSubmit={handleAddTodo} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                placeholder="What needs to be done?"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={styles.input}
                disabled={submitting}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="description">Description (optional)</label>
              <textarea
                id="description"
                placeholder="Add more details..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                style={styles.textarea}
                disabled={submitting}
                rows={3}
              />
            </div>
            <button
              type="submit"
              style={submitting ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
              disabled={submitting || !newTitle.trim()}
            >
              {submitting ? 'Adding...' : '+ Add Todo'}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} style={styles.errorClose}>✕</button>
          </div>
        )}

        {/* Filter Tabs */}
        <div style={styles.filterRow}>
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={filter === f ? { ...styles.filterBtn, ...styles.filterBtnActive } : styles.filterBtn}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Todo List */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Your Todos</h2>
          {loading ? (
            <div style={styles.centered}>
              <div style={styles.spinner} />
              <p style={{ color: '#9ca3af', marginTop: '12px' }}>Loading todos...</p>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div style={styles.centered}>
              <p style={styles.emptyIcon}>📋</p>
              <p style={styles.emptyText}>
                {filter === 'all' ? 'No todos yet. Add one above!' :
                 filter === 'active' ? 'No active todos.' : 'No completed todos.'}
              </p>
            </div>
          ) : (
            <ul style={styles.todoList}>
              {filteredTodos.map((todo) => (
                <li key={todo.id} style={todo.completed ? { ...styles.todoItem, ...styles.todoItemCompleted } : styles.todoItem}>
                  <div style={styles.todoMain}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleComplete(todo)}
                        style={styles.checkbox}
                      />
                      <span style={styles.checkboxCustom}>
                        {todo.completed && <span style={styles.checkmark}>✓</span>}
                      </span>
                    </label>
                    <div style={styles.todoContent}>
                      <p style={todo.completed ? { ...styles.todoTitle, ...styles.todoTitleCompleted } : styles.todoTitle}>
                        {todo.title}
                      </p>
                      {todo.description && (
                        <p style={styles.todoDescription}>{todo.description}</p>
                      )}
                      <p style={styles.todoDate}>Created: {formatDate(todo.createdAt)}</p>
                    </div>
                  </div>
                  <div style={styles.todoActions}>
                    <button
                      onClick={() => openEditModal(todo)}
                      style={styles.editBtn}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    {deleteConfirm === todo.id ? (
                      <div style={styles.deleteConfirm}>
                        <span style={styles.deleteConfirmText}>Delete?</span>
                        <button onClick={() => handleDelete(todo.id)} style={styles.confirmYes}>Yes</button>
                        <button onClick={() => setDeleteConfirm(null)} style={styles.confirmNo}>No</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(todo.id)}
                        style={styles.deleteBtn}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModal.open && (
        <div style={styles.modalOverlay} onClick={closeEditModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Todo</h2>
              <button onClick={closeEditModal} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title *</label>
                <input
                  type="text"
                  value={editModal.title}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, title: e.target.value }))}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={editModal.description}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, description: e.target.value }))}
                  style={styles.textarea}
                  rows={4}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={closeEditModal} style={styles.cancelBtn}>Cancel</button>
              <button
                onClick={handleEditSave}
                style={!editModal.title.trim() ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
                disabled={!editModal.title.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    padding: '24px 16px',
  },
  wrapper: {
    maxWidth: '720px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  headerTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  },
  headerSubtitle: {
    color: '#64748b',
    fontSize: '1rem',
    margin: 0,
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 20px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    fontSize: '0.95rem',
    color: '#1e293b',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: '#f8fafc',
    width: '100%',
    boxSizing: 'border-box',
  },
  textarea: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    fontSize: '0.95rem',
    color: '#1e293b',
    outline: 'none',
    resize: 'vertical',
    backgroundColor: '#f8fafc',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  button: {
    padding: '11px 20px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
    cursor: 'not-allowed',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
    color: '#dc2626',
    fontSize: '0.9rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#dc2626',
    fontSize: '1rem',
    padding: '0 0 0 8px',
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  filterBtn: {
    flex: 1,
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterBtnActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
    color: '#ffffff',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 0',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyIcon: {
    fontSize: '3rem',
    margin: '0 0 12px 0',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: '1rem',
  },
  todoList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  todoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    backgroundColor: '#fafafa',
    transition: 'border-color 0.2s',
    gap: '12px',
  },
  todoItemCompleted: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  todoMain: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    flex: 1,
    minWidth: 0,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    cursor: 'pointer',
    paddingTop: '2px',
  },
  checkbox: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  checkboxCustom: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    borderRadius: '6px',
    border: '2px solid #cbd5e1',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  checkmark: {
    color: '#10b981',
    fontSize: '14px',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  todoContent: {
    flex: 1,
    minWidth: 0,
  },
  todoTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 4px 0',
    wordBreak: 'break-word',
  },
  todoTitleCompleted: {
    textDecoration: 'line-through',
    color: '#94a3b8',
  },
  todoDescription: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: '0 0 6px 0',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  todoDate: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    margin: 0,
  },
  todoActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  editBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.1rem',
    padding: '4px',
    borderRadius: '6px',
    transition: 'background 0.2s',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.1rem',
    padding: '4px',
    borderRadius: '6px',
    transition: 'background 0.2s',
  },
  deleteConfirm: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  deleteConfirmText: {
    fontSize: '0.8rem',
    color: '#ef4444',
    fontWeight: '500',
  },
  confirmYes: {
    padding: '4px 10px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontWeight: '600',
  },
  confirmNo: {
    padding: '4px 10px',
    backgroundColor: '#e2e8f0',
    color: '#374151',
    border: 'none',
    borderRadius: '5px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px 16px',
    borderBottom: '1px solid #f1f5f9',
  },
  modalTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.1rem',
    color: '#94a3b8',
    padding: '4px',
    borderRadius: '6px',
  },
  modalBody: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalFooter: {
    padding: '16px 24px 20px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    borderTop: '1px solid #f1f5f9',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
