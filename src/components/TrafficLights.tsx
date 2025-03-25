import { useMemo } from "react";
import { clsx } from "clsx";
import MacOSClose from "@icons/MacOSClose";
import MacOSMinimize from "@icons/MacOSMinimize";
import MacOSFullscreen from "@icons/MacOSFullscreen";
import { useFocusState } from "@hooks/useFocusState";

export function TrafficLights(
  { onClose, onMinimize, onFullscreen }: 
  { onClose: () => void, onMinimize: () => void, onFullscreen: () => void, focused: boolean }
) {
  const [focused] = useFocusState();

  return (
    <div
      data-tauri-drag-region
      className={clsx('group flex flex-row space-x-[7.5px]')}
    >
      <TrafficLight type="close" onClick={onClose} colorful={focused ?? false} />
      <TrafficLight type="minimize" onClick={onMinimize} colorful={focused ?? false} />
      <TrafficLight type="fullscreen" onClick={onFullscreen} colorful={focused ?? false} />
    </div>
  );
}

function TrafficLight(
  { onClick, colorful, type }: 
  { onClick: () => void, colorful: boolean, type: string }
) {
  const icon = useMemo(() => {
    switch (type) {
      case 'close':
        return <MacOSClose />;
      case 'minimize':
        return <MacOSMinimize />;
      case 'fullscreen':
        return <MacOSFullscreen />;
    }
  }, [type]);

  return (
    <div
      onClick={onClick}
      className={clsx(
        'box-content flex size-[12px] items-center justify-center rounded-full border-[0.5px] border-transparent bg-[#CDCED0] dark:bg-[#2B2C2F]',
        {
          'border-red-900 !bg-[#EC6A5E] active:hover:!bg-red-700 dark:active:hover:!bg-red-300':
            type === 'close' && colorful,
          'group-hover:!bg-[#EC6A5E]': type === 'close',
          'border-[#F4BE4F] !bg-[#F4BE4F] active:hover:!bg-yellow-600 dark:active:hover:!bg-yellow-200':
            type === 'minimize' && colorful,
          'group-hover:!bg-[#F4BE4F]': type === 'minimize',
          'border-green-900 !bg-[#61C253] active:hover:!bg-green-700 dark:active:hover:!bg-green-300':
            type === 'fullscreen' && colorful,
          'group-hover:!bg-[#61C253]': type === 'fullscreen'
        }
      )}
    >
      {icon}
    </div>
  );
}
