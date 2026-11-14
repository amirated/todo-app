// Inline confirmation shown before a tab (and its tasks) is deleted.
function DeleteTabConfirm({ group, taskCount, isDeleting, onConfirm, onCancel }) {
  const tasks = `${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`;

  return (
    <div className="confirm-bar" role="alertdialog" aria-labelledby="delete-tab-message">
      <p id="delete-tab-message">
        Delete <strong>{group.name}</strong>
        {taskCount > 0 ? <> and its {tasks}</> : null}? This can't be undone.
      </p>
      <div className="confirm-actions">
        <button type="button" onClick={onCancel} disabled={isDeleting} autoFocus>
          Cancel
        </button>
        <button type="button" className="danger" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? 'Deleting…' : 'Delete tab'}
        </button>
      </div>
    </div>
  );
}

export default DeleteTabConfirm;
