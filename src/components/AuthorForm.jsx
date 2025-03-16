import { useState } from 'react';
import { useDialog } from '../context/DialogContext';

function AuthorForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { closeDialog } = useDialog();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!name.trim()) {
      setError('Author name is required');
      return;
    }
    
    if (name.trim().length < 2) {
      setError('Author name must be at least 2 characters');
      return;
    }
    
    // Submit
    setIsSubmitting(true);
    
    try {
      const success = await onSubmit(name.trim());
      
      if (success) {
        // Close dialog on success
        closeDialog();
      } else {
        // Reset submitting state if not successful
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting author:', error);
      setError('An error occurred while creating the author');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    closeDialog();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="author-name" className="block text-sm font-medium text-slate-300 mb-1">
          Author Name
        </label>
        <input
          type="text"
          id="author-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md 
                    text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 
                    focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
          placeholder="Enter author name"
          autoFocus
          disabled={isSubmitting}
        />
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
      
      <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-slate-700/30">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 
                    rounded-md transition-colors focus:outline-none focus:ring-2 
                    focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white 
                    rounded-md transition-colors focus:outline-none focus:ring-2 
                    focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800
                    flex items-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            'Add Author'
          )}
        </button>
      </div>
    </form>
  );
}

export default AuthorForm; 
