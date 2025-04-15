import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagsMenu from '@components/TagsMenu';

// Mock the TagFill icon
vi.mock('../icons/TagFill', () => ({
  default: () => <div data-testid="tag-icon">Tag Icon</div>
}));

describe('TagsMenu', () => {
  const mockTags = [
    { id: '1', name: 'Tag 1' },
    { id: '2', name: 'Tag 2' },
  ];

  const mockOnAddTag = vi.fn();
  const mockOnRemoveTag = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tag count and icon', () => {
    render(
      <TagsMenu
        tags={mockTags}
        quoteId="1"
        isOpen={true}
      />
    );

    expect(screen.getByTestId('tag-icon')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Shows tag count
  });

  it('shows menu with tags when clicked', async () => {
    render(
      <TagsMenu
        tags={mockTags}
        quoteId="1"
        isOpen={true}
      />
    );

    // Click the trigger
    const trigger = screen.getByTestId('tag-icon').parentElement;
    await userEvent.click(trigger!);

    // Check if tags are displayed
    expect(screen.getByText('Tag 1')).toBeInTheDocument();
    expect(screen.getByText('Tag 2')).toBeInTheDocument();
  });

  it('shows empty state when no tags', async () => {
    render(
      <TagsMenu
        tags={[]}
        quoteId="1"
        isOpen={true}
        />
    );

    const trigger = screen.getByTestId('tag-icon').parentElement;
    await userEvent.click(trigger!);

    expect(screen.getByText('No tags added yet')).toBeInTheDocument();
  });

  it('calls onAddTag when adding a new tag', async () => {
    render(
      <TagsMenu
        tags={mockTags}
        quoteId="1"
        isOpen={true}
      />
    );

    const trigger = screen.getByTestId('tag-icon').parentElement;
    await userEvent.click(trigger!);

    const input = screen.getByPlaceholderText('Add new tag...');
    await userEvent.type(input, 'New Tag');
    
    const addButton = screen.getByText('Add');
    await userEvent.click(addButton);

    expect(mockOnAddTag).toHaveBeenCalledWith('New Tag');
  });

  it('calls onRemoveTag when removing a tag', async () => {
    render(
      <TagsMenu
        tags={mockTags}
        quoteId="1"
        isOpen={true}
      />
    );

    const trigger = screen.getByTestId('tag-icon').parentElement;
    await userEvent.click(trigger!);

    // Find the specific tag's remove button
    const tag1Element = screen.getByText('Tag 1');
    const removeButton = tag1Element.parentElement?.querySelector('button');
    expect(removeButton).toBeInTheDocument();
    
    await userEvent.click(removeButton!);
    expect(mockOnRemoveTag).toHaveBeenCalledWith('1');
  });

  it('disables add button when input is empty', async () => {
    render(
      <TagsMenu
        tags={mockTags}
        quoteId="1"
        isOpen={true}
      />
    );

    const trigger = screen.getByTestId('tag-icon').parentElement;
    await userEvent.click(trigger!);

    const addButton = screen.getByText('Add');
    expect(addButton).toBeDisabled();

    const input = screen.getByPlaceholderText('Add new tag...');
    await userEvent.type(input, 'New Tag');
    expect(addButton).not.toBeDisabled();

    await userEvent.clear(input);
    expect(addButton).toBeDisabled();
  });

  it('applies custom className', () => {
    render(
      <TagsMenu
        tags={mockTags}
        quoteId="1"
        isOpen={true}
        className="custom-class"
      />
    );

    const wrapper = screen.getByTestId('tag-icon').parentElement?.parentElement;
    expect(wrapper).toHaveClass('custom-class');
  });
}); 
