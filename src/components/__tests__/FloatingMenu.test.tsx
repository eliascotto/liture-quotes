import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FloatingMenu from '@components/FloatingMenu';

describe('FloatingMenu', () => {
  const mockTrigger = <button>Open Menu</button>;
  const mockContent = <div>Menu Content</div>;

  it('renders trigger element', () => {
    render(
      <FloatingMenu trigger={mockTrigger}>
        {mockContent}
      </FloatingMenu>
    );
    
    expect(screen.getByText('Open Menu')).toBeInTheDocument();
  });

  it('shows menu content when trigger is clicked', () => {
    render(
      <FloatingMenu trigger={mockTrigger}>
        {mockContent}
      </FloatingMenu>
    );
    
    expect(screen.queryByText('Menu Content')).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Open Menu'));
    expect(screen.getByText('Menu Content')).toBeInTheDocument();
  });

  it('hides menu content when trigger is clicked again', () => {
    render(
      <FloatingMenu trigger={mockTrigger}>
        {mockContent}
      </FloatingMenu>
    );
    
    fireEvent.click(screen.getByText('Open Menu'));
    expect(screen.getByText('Menu Content')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Open Menu'));
    expect(screen.queryByText('Menu Content')).not.toBeInTheDocument();
  });

  it('works with controlled open state', () => {
    const { rerender } = render(
      <FloatingMenu trigger={mockTrigger} isOpen={false}>
        {mockContent}
      </FloatingMenu>
    );
    
    expect(screen.queryByText('Menu Content')).not.toBeInTheDocument();
    
    rerender(
      <FloatingMenu trigger={mockTrigger} isOpen={true}>
        {mockContent}
      </FloatingMenu>
    );
    
    expect(screen.getByText('Menu Content')).toBeInTheDocument();
  });

  it('calls onOpenChange when trigger is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <FloatingMenu 
        trigger={mockTrigger} 
        isOpen={false} 
        onOpenChange={onOpenChange}
      >
        {mockContent}
      </FloatingMenu>
    );
    
    fireEvent.click(screen.getByText('Open Menu'));
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.any(Object), expect.any(String));
  });

  it('renders in portal when usePortal is true', () => {
    render(
      <FloatingMenu trigger={mockTrigger} usePortal={true}>
        {mockContent}
      </FloatingMenu>
    );
    
    fireEvent.click(screen.getByText('Open Menu'));
    
    // Menu content should be rendered in a portal
    const menuContent = screen.getByText('Menu Content');
    expect(menuContent.closest('[data-floating-ui-portal]')).toBeInTheDocument();
  });

  it('applies custom className to trigger wrapper', () => {
    render(
      <FloatingMenu 
        trigger={mockTrigger} 
        className="custom-trigger-class"
      >
        {mockContent}
      </FloatingMenu>
    );
    
    const triggerWrapper = screen.getByText('Open Menu').parentElement;
    expect(triggerWrapper).toHaveClass('custom-trigger-class');
  });

  it('applies custom menuClassName to menu content', () => {
    render(
      <FloatingMenu 
        trigger={mockTrigger} 
        menuClassName="custom-menu-class"
      >
        {mockContent}
      </FloatingMenu>
    );
    
    fireEvent.click(screen.getByText('Open Menu'));
    const menuContent = screen.getByText('Menu Content').parentElement;
    expect(menuContent).toHaveClass('custom-menu-class');
  });

  it('closes when clicking outside', () => {
    const onOpenChange = vi.fn();
    render(
      <FloatingMenu 
        trigger={mockTrigger} 
        isOpen={true} 
        onOpenChange={onOpenChange}
      >
        {mockContent}
      </FloatingMenu>
    );
    
    // Click outside the menu
    fireEvent.mouseDown(document.body);
    
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close when clicking inside the menu', () => {
    const onOpenChange = vi.fn();
    render(
      <FloatingMenu 
        trigger={mockTrigger} 
        isOpen={true} 
        onOpenChange={onOpenChange}
      >
        <div data-testid="menu-content">Menu Content</div>
      </FloatingMenu>
    );
    
    // Click inside the menu
    fireEvent.mouseDown(screen.getByTestId('menu-content'));
    
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('accepts numeric offset value', () => {
    const { container } = render(
      <FloatingMenu 
        trigger={mockTrigger} 
        isOpen={true}
        offset={8}
      >
        {mockContent}
      </FloatingMenu>
    );
    
    const menuContent = screen.getByText('Menu Content').parentElement;
    expect(menuContent).toHaveStyle({ position: 'absolute' });
  });

  it('accepts object offset value with mainAxis and crossAxis', () => {
    const { container } = render(
      <FloatingMenu 
        trigger={mockTrigger} 
        isOpen={true}
        offset={{
          mainAxis: 8,
          crossAxis: 4,
        }}
      >
        {mockContent}
      </FloatingMenu>
    );
    
    const menuContent = screen.getByText('Menu Content').parentElement;
    expect(menuContent).toHaveStyle({ position: 'absolute' });
  });

  it('uses reference height for offset when useReferenceHeight is true', () => {
    const { container } = render(
      <FloatingMenu 
        trigger={<div style={{ height: '50px' }}>Trigger</div>}
        isOpen={true}
        useReferenceHeight={true}
      >
        {mockContent}
      </FloatingMenu>
    );
    
    const menuContent = screen.getByText('Menu Content').parentElement;
    expect(menuContent).toHaveStyle({ position: 'absolute' });
  });
}); 
