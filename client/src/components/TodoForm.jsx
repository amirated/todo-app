
import { useState } from 'react';

function TodoForm({ onAdd }) {
  const [title, setTitle] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const success = await onAdd(trimmedTitle);

    if (success) {
      setTitle('');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
      />

      <button type="submit" disabled={!title.trim()}>
        Add Task
      </button>
    </form>
  );
}

export default TodoForm;
