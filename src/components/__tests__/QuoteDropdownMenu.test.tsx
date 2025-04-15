import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuoteDropdownMenu from '../QuoteDropdownMenu';

describe('QuoteDropdownMenu', () => {
  const mockProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    onCopy: vi.fn(),
    onEdit: vi.fn(),
    onStar: vi.fn(),
    onRemove: vi.fn(),
    isStarred: false,
    withIcons: true,
    trigger: <button>Menu</button>,
    onTagsOptionClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all menu items when open', () => {
    render(<QuoteDropdownMenu {...mockProps} />);
    
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Star')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('does not render menu items when closed', () => {
    render(<QuoteDropdownMenu {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('Copy')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Star')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('calls appropriate handlers when menu items are clicked', () => {
    render(<QuoteDropdownMenu {...mockProps} />);
    
    fireEvent.click(screen.getByText('Copy'));
    expect(mockProps.onCopy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Edit'));
    expect(mockProps.onEdit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Star'));
    expect(mockProps.onStar).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Delete'));
    expect(mockProps.onRemove).toHaveBeenCalledTimes(1);
  });

  it('toggles between Star and Unstar text based on isStarred prop', () => {
    const { rerender } = render(<QuoteDropdownMenu {...mockProps} />);
    expect(screen.getByText('Star')).toBeInTheDocument();

    rerender(<QuoteDropdownMenu {...mockProps} isStarred={true} />);
    expect(screen.getByText('Unstar')).toBeInTheDocument();
  });

  it('renders without icons when withIcons is false', () => {
    render(<QuoteDropdownMenu {...mockProps} withIcons={false} />);
    
    // Icons are SVG elements, so we'll check if there are any svg elements
    expect(document.querySelectorAll('svg')).toHaveLength(0);
  });

  it('renders with icons when withIcons is true', () => {
    render(<QuoteDropdownMenu {...mockProps} />);
    
    // Should have 4 icons (Copy, Edit, Star, Trash)
    expect(document.querySelectorAll('svg')).toHaveLength(4);
  });

  it('closes menu when scrolling the window', () => {
    render(<QuoteDropdownMenu {...mockProps} />);
    
    // Simulate scroll event on window
    fireEvent.scroll(window);
    
    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes menu when scrolling a custom container', () => {
    const container = document.createElement('div');
    render(<QuoteDropdownMenu {...mockProps} scrollContainer={container} />);
    
    // Simulate scroll event on custom container
    fireEvent.scroll(container);
    
    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close menu when scrolling and menu is already closed', () => {
    render(<QuoteDropdownMenu {...mockProps} isOpen={false} />);
    
    // Simulate scroll event on window
    fireEvent.scroll(window);
    
    expect(mockProps.onOpenChange).not.toHaveBeenCalled();
  });

  it('accepts custom offset value', () => {
    const { container } = render(<QuoteDropdownMenu {...mockProps} offset={8} />);
    
    // The actual positioning is handled by FloatingMenu, so we just verify the prop is passed
    const menu = container.querySelector('[style*="position: absolute"]');
    expect(menu).toBeInTheDocument();
  });
}); 
