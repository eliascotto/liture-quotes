import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, act, waitFor } from '@testing-library/react';
import SecondarySidebar from '@components/SecondarySidebar';
import { useSecondarySidebarStore } from '@stores/secondary-sidebar';
import type { Mock } from 'vitest';

// Mock the stores
vi.mock('@stores/secondary-sidebar');
vi.mock('@stores/app', () => ({
  useAppStore: () => ({
    currentView: 'books',
    setCurrentView: vi.fn(),
  }),
}));

describe('SecondarySidebar', () => {
  const mockItems = [
    { id: 1, title: 'Test Item 1' },
    { id: 2, title: 'Test Item 2' },
    { id: 3, title: '' }, // Empty title for testing
  ];

  const mockProps = {
    property: 'title',
    items: mockItems,
    selected: mockItems[0],
    onSelection: vi.fn(),
  };

  const mockStore = {
    isOpen: true,
    width: 240,
    lastWidth: 240,
    isResizing: false,
    isScrolled: false,
    isEmpty: false,
    fullyExpanded: true,
    MIN_WIDTH: 180,
    MAX_WIDTH: 400,
    setIsOpen: vi.fn(),
    setWidth: vi.fn(),
    setLastWidth: vi.fn(),
    setIsResizing: vi.fn(),
    setIsScrolled: vi.fn(),
    setIsEmpty: vi.fn(),
    setFullyExpanded: vi.fn(),
  };

  beforeEach(() => {
    (useSecondarySidebarStore as unknown as Mock).mockImplementation(() => mockStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<SecondarySidebar {...mockProps} />);
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    expect(screen.getByText('No title')).toBeInTheDocument();
  });

  it('handles item selection', () => {
    render(<SecondarySidebar {...mockProps} />);
    fireEvent.click(screen.getByText('Test Item 2'));
    expect(mockProps.onSelection).toHaveBeenCalledWith(mockItems[1]);
  });

  it('handles sidebar collapse', () => {
    render(<SecondarySidebar {...mockProps} />);
    const collapseButton = screen.getByRole('button', { name: '' }); // The collapse button
    fireEvent.click(collapseButton);
    
    expect(mockStore.setLastWidth).toHaveBeenCalledWith(240);
    expect(mockStore.setIsOpen).toHaveBeenCalledWith(false);
    expect(mockStore.setFullyExpanded).toHaveBeenCalledWith(false);
  });

  it('handles scroll events', () => {
    render(<SecondarySidebar {...mockProps} />);
    const scrollContainer = screen.getByRole('list').parentElement;
    fireEvent.scroll(scrollContainer!, { target: { scrollTop: 100 } });
    expect(mockStore.setIsScrolled).toHaveBeenCalledWith(true);
  });

  // it('handles resize events', () => {
  //   // Mock window.innerWidth
  //   Object.defineProperty(window, 'innerWidth', {
  //     writable: true,
  //     configurable: true,
  //     value: 1000,
  //   });

  //   render(<SecondarySidebar {...mockProps} />);
  //   const resizeHandle = document.querySelector('[class*="cursor-col-resize"]');
    
  //   // Start resize
  //   fireEvent.mouseDown(resizeHandle!);
  //   expect(mockStore.setIsResizing).toHaveBeenCalledWith(true);

  //   // Move mouse - for right sidebar, width = window.innerWidth - clientX
  //   fireEvent.mouseMove(document, { clientX: 800 });
  //   expect(mockStore.setWidth).toHaveBeenCalledWith(200); // 1000 - 800 = 200

  //   // End resize
  //   fireEvent.mouseUp(document);
  //   expect(mockStore.setIsResizing).toHaveBeenCalledWith(false);
  // });

  it('updates isEmpty when items change', () => {
    const { rerender } = render(<SecondarySidebar {...mockProps} />);
    expect(mockStore.setIsEmpty).toHaveBeenCalledWith(false);

    rerender(<SecondarySidebar {...mockProps} items={[]} />);
    expect(mockStore.setIsEmpty).toHaveBeenCalledWith(true);
  });
}); 
