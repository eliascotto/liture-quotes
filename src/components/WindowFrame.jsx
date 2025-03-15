import { useState, useEffect } from 'react';

function WindowFrame() {
  const [isMaximized, setIsMaximized] = useState(false);

  // For Tauri 2.0, we need to use the window API differently
  const minimize = async () => {
    try {
      // Import dynamically to avoid issues during build
      const { WebviewWindow } = await import('@tauri-apps/api/window');
      const appWindow = WebviewWindow.getByLabel('main');
      if (appWindow) {
        await appWindow.minimize();
      }
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const toggleMaximize = async () => {
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/window');
      const appWindow = WebviewWindow.getByLabel('main');
      
      if (appWindow) {
        if (isMaximized) {
          await appWindow.unmaximize();
          setIsMaximized(false);
        } else {
          await appWindow.maximize();
          setIsMaximized(true);
        }
      }
    } catch (error) {
      console.error('Failed to toggle maximize:', error);
    }
  };

  const close = async () => {
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/window');
      const appWindow = WebviewWindow.getByLabel('main');
      if (appWindow) {
        await appWindow.close();
      }
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  // Check if window is maximized on mount
  useEffect(() => {
    const checkMaximized = async () => {
      try {
        const { WebviewWindow } = await import('@tauri-apps/api/window');
        const appWindow = WebviewWindow.getByLabel('main');
        if (appWindow) {
          const isMax = await appWindow.isMaximized();
          setIsMaximized(isMax);
        }
      } catch (error) {
        console.error('Failed to check if window is maximized:', error);
      }
    };
    
    checkMaximized();
  }, []);

  return (
    <div 
      className="bg-slate-900 h-8 flex items-center justify-between px-3 w-full"
      data-tauri-drag-region
    ></div>
  );
}

export default WindowFrame; 
