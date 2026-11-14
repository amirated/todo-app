import { useState } from 'react';

const TAB_NAME_MAX_LENGTH = 50; // matches the server's limit

// Inline text field for naming a tab. Enter or blur saves, Escape cancels.
// `onSave` returns true when the name was saved, false to keep editing.
function TabNameInput({ initialValue = '', label, onSave, onCancel }) {
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    const name = value.trim();

    // Nothing to save: leave edit mode without a request.
    if (!name || name === initialValue) {
      onCancel();
      return;
    }

    setIsSaving(true);
    const saved = await onSave(name);
    // On success the parent unmounts this input; on failure keep it open.
    if (!saved) setIsSaving(false);
  }

  return (
    <input
      className="tab-name-input"
      type="text"
      aria-label={label}
      value={value}
      maxLength={TAB_NAME_MAX_LENGTH}
      disabled={isSaving}
      autoFocus
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') onCancel();
      }}
      onBlur={() => {
        if (!isSaving) save();
      }}
    />
  );
}

export default TabNameInput;
