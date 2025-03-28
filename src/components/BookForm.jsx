import { useState, useEffect } from 'react';
import { useDialog } from '../context/DialogContext.tsx';

function BookForm({ onSubmit, onCancel, authors, selectedAuthor }) {
  const [title, setTitle] = useState('');
  const [authorOption, setAuthorOption] = useState(selectedAuthor ? 'existing' : authors.length > 0 ? 'existing' : 'new');
  const [authorId, setAuthorId] = useState(selectedAuthor ? selectedAuthor.id : '');
  const [newAuthorName, setNewAuthorName] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { closeDialog } = useDialog();

  // Set the selected author if provided
  useEffect(() => {
    if (selectedAuthor) {
      setAuthorOption('existing');
      setAuthorId(selectedAuthor.id);
    } else if (authors.length === 0) {
      setAuthorOption('new');
    }
  }, [selectedAuthor, authors]);

  const validate = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Book title is required';
    } else if (title.trim().length < 2) {
      newErrors.title = 'Book title must be at least 2 characters';
    }
    
    if (authorOption === 'existing' && !authorId) {
      newErrors.authorId = 'Please select an author';
    }
    
    if (authorOption === 'new' && !newAuthorName.trim()) {
      newErrors.newAuthorName = 'Author name is required';
    } else if (authorOption === 'new' && newAuthorName.trim().length < 2) {
      newErrors.newAuthorName = 'Author name must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await onSubmit({
        title: title.trim(),
        authorOption,
        authorId: authorOption === 'existing' ? authorId : null,
        newAuthorName: authorOption === 'new' ? newAuthorName.trim() : null
      });
      
      if (success) {
        // Close dialog on success
        closeDialog();
      } else {
        // Reset submitting state if not successful
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting book:', error);
      setErrors({ 
        ...errors, 
        form: 'An error occurred while creating the book' 
      });
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    closeDialog();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-md p-3 text-sm text-red-300">
          {errors.form}
        </div>
      )}
      
      <div>
        <label htmlFor="book-title" className="block text-sm font-medium text-slate-300 mb-1">
          Book Title
        </label>
        <input
          type="text"
          id="book-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrors({ ...errors, title: '' });
          }}
          className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md 
                    text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 
                    focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
          placeholder="Enter book title"
          autoFocus
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-400">{errors.title}</p>
        )}
      </div>
      
      <div className="pt-2">
        <fieldset>
          <legend className="block text-sm font-medium text-slate-300 mb-2">Author</legend>
          
          <div className="space-y-3 bg-slate-700/20 p-3 rounded-md border border-slate-700/50">
            {authors.length > 0 && (
              <div className="flex items-center">
                <input
                  type="radio"
                  id="existing-author"
                  name="author-option"
                  value="existing"
                  checked={authorOption === 'existing'}
                  onChange={() => {
                    setAuthorOption('existing');
                    setErrors({ ...errors, newAuthorName: '' });
                  }}
                  className="h-4 w-4 text-cyan-500 focus:ring-cyan-400 bg-slate-700 border-slate-600"
                  disabled={isSubmitting}
                />
                <label htmlFor="existing-author" className="ml-2 text-sm text-slate-300">
                  Select existing author
                </label>
              </div>
            )}
            
            <div className="flex items-center">
              <input
                type="radio"
                id="new-author"
                name="author-option"
                value="new"
                checked={authorOption === 'new'}
                onChange={() => {
                  setAuthorOption('new');
                  setErrors({ ...errors, authorId: '' });
                }}
                className="h-4 w-4 text-cyan-500 focus:ring-cyan-400 bg-slate-700 border-slate-600"
                disabled={isSubmitting}
              />
              <label htmlFor="new-author" className="ml-2 text-sm text-slate-300">
                Create new author
              </label>
            </div>
          </div>
        </fieldset>
      </div>
      
      {authorOption === 'existing' && authors.length > 0 && (
        <div className="ml-6 transition-all duration-200 animate-fadeIn">
          <label htmlFor="author-select" className="block text-sm font-medium text-slate-300 mb-1">
            Select Author
          </label>
          <select
            id="author-select"
            value={authorId}
            onChange={(e) => {
              setAuthorId(e.target.value);
              setErrors({ ...errors, authorId: '' });
            }}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md 
                      text-slate-200 focus:outline-none focus:ring-2 
                      focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
            disabled={isSubmitting}
          >
            <option value="">Select an author</option>
            {authors.map(author => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>
          {errors.authorId && (
            <p className="mt-1 text-sm text-red-400">{errors.authorId}</p>
          )}
        </div>
      )}
      
      {authorOption === 'new' && (
        <div className="ml-6 transition-all duration-200 animate-fadeIn">
          <label htmlFor="new-author-name" className="block text-sm font-medium text-slate-300 mb-1">
            New Author Name
          </label>
          <input
            type="text"
            id="new-author-name"
            value={newAuthorName}
            onChange={(e) => {
              setNewAuthorName(e.target.value);
              setErrors({ ...errors, newAuthorName: '' });
            }}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md 
                      text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 
                      focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
            placeholder="Enter author name"
            disabled={isSubmitting}
          />
          {errors.newAuthorName && (
            <p className="mt-1 text-sm text-red-400">{errors.newAuthorName}</p>
          )}
        </div>
      )}
      
      <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-slate-700/30">
        <button
          type="button"
          onClick={handleCancel}
          className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 
                    rounded-md transition-colors focus:outline-none focus:ring-2 
                    focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-500 text-white 
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
            'Add Book'
          )}
        </button>
      </div>
    </form>
  );
}

export default BookForm; 
