import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddButtonMenu from '@components/AddButtonMenu';
import { DialogProvider } from '@context/DialogContext';
import { Author } from '@customTypes/index';

// Mock the icons
vi.mock('@icons/Plus', () => ({
  default: () => <div data-testid="plus-icon">Plus Icon</div>
}));

vi.mock('@icons/User', () => ({
  default: () => <div data-testid="user-icon">User Icon</div>
}));

vi.mock('@icons/Import', () => ({
  default: () => <div data-testid="import-icon">Import Icon</div>
}));

// Mock the forms
vi.mock('@components/NewAuthorForm.tsx', () => ({
  default: ({ onSubmit, onCancel }: { onSubmit: (name: string) => Promise<boolean>, onCancel: () => void }) => (
    <div data-testid="new-author-form">
      <button onClick={() => onSubmit('Test Author')}>Submit Author</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

vi.mock('@components/NewBookForm.jsx', () => ({
  default: ({ onSubmit, onCancel }: { onSubmit: (data: any) => Promise<boolean>, onCancel: () => void }) => (
    <div data-testid="new-book-form">
      <button onClick={() => onSubmit({ title: 'Test Book' })}>Submit Book</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

// Mock logger
vi.mock('@utils/logger', () => ({
  default: {
    getInstance: () => ({
      debug: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

describe('AddButtonMenu', () => {
  const mockOnClick = vi.fn();
  const mockOnImportKobo = vi.fn();
  const mockOnImportKindle = vi.fn();
  const mockOnImportIBooks = vi.fn();
  
  const currentDate = new Date().toISOString();
  const mockAuthors: Author[] = [
    {
      id: '1',
      name: 'Author 1',
      created_at: currentDate,
      updated_at: currentDate,
      deleted_at: null,
      original_id: null
    },
    {
      id: '2',
      name: 'Author 2',
      created_at: currentDate,
      updated_at: currentDate,
      deleted_at: null,
      original_id: null
    }
  ];
  const mockSelectedAuthor = mockAuthors[0];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <DialogProvider>
        <AddButtonMenu
          onClick={mockOnClick}
          authors={mockAuthors}
          selectedAuthor={mockSelectedAuthor}
          onImportKobo={mockOnImportKobo}
          onImportKindle={mockOnImportKindle}
          onImportIBooks={mockOnImportIBooks}
        />
      </DialogProvider>
    );
  };

  it('renders the add button with plus icon', () => {
    renderComponent();
    expect(screen.getByTitle('Add new item')).toBeInTheDocument();
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
  });

  it('opens popover menu when clicking the add button', async () => {
    renderComponent();
    const addButton = screen.getByTitle('Add new item');
    await userEvent.click(addButton);
    
    expect(screen.getByText('New Author')).toBeInTheDocument();
    expect(screen.getByText('New Book')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('closes popover when clicking outside', async () => {
    renderComponent();
    const addButton = screen.getByTitle('Add new item');
    await userEvent.click(addButton);
    
    expect(screen.getByText('New Author')).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('New Author')).not.toBeInTheDocument();
    });
  });

  it('handles adding a new author', async () => {
    mockOnClick.mockResolvedValue(true);
    renderComponent();
    
    const addButton = screen.getByTitle('Add new item');
    await userEvent.click(addButton);
    
    const newAuthorButton = screen.getByText('New Author');
    await userEvent.click(newAuthorButton);
    
    // Find and click submit in the author form
    const submitButton = screen.getByText('Submit Author');
    await userEvent.click(submitButton);
    
    expect(mockOnClick).toHaveBeenCalledWith('author', { authorName: 'Test Author' });
  });

  it('handles adding a new book', async () => {
    mockOnClick.mockResolvedValue(true);
    renderComponent();
    
    const addButton = screen.getByTitle('Add new item');
    await userEvent.click(addButton);
    
    const newBookButton = screen.getByText('New Book');
    await userEvent.click(newBookButton);
    
    // Find and click submit in the book form
    const submitButton = screen.getByText('Submit Book');
    await userEvent.click(submitButton);
    
    expect(mockOnClick).toHaveBeenCalledWith('book', { title: 'Test Book' });
  });

  describe('import options', () => {
    const openImportSubmenu = async () => {
      const addButton = screen.getByTitle('Add new item');
      await userEvent.click(addButton);
      
      const importButton = screen.getByText('Import').parentElement;
      if (!importButton) throw new Error('Import button not found');
      
      fireEvent.mouseEnter(importButton);
      
      // Wait for submenu to be visible
      await waitFor(() => {
        expect(screen.getByText('From Kobo Reader file')).toBeInTheDocument();
      });
    };

    it('handles importing from Kobo', async () => {
      renderComponent();
      await openImportSubmenu();
      
      await userEvent.click(screen.getByText('From Kobo Reader file'));
      expect(mockOnImportKobo).toHaveBeenCalled();
    });

    it('handles importing from Kindle', async () => {
      renderComponent();
      await openImportSubmenu();
      
      await userEvent.click(screen.getByText('From Kindle Clippings file'));
      expect(mockOnImportKindle).toHaveBeenCalled();
    });

    it('handles importing from iBooks', async () => {
      renderComponent();
      await openImportSubmenu();
      
      await userEvent.click(screen.getByText('From iBooks'));
      expect(mockOnImportIBooks).toHaveBeenCalled();
    });
  });
}); 
