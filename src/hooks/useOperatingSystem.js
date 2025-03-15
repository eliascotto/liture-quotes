import { useState, useEffect } from 'react';
import { usePlatform } from '../utils/platform';

export function guessOperatingSystem() {
    let os = 'unknown';
    if (navigator.userAgent.indexOf('Win') != -1) os = 'windows';
    if (navigator.userAgent.indexOf('Mac') != -1) os = 'macOS';
    if (navigator.userAgent.indexOf('X11') != -1 || navigator.userAgent.indexOf('Linux') != -1)
        os = 'linux';
    return os;
}

// This hook will return the current os we are using.
// It will guess the OS on first render until Tauri responds with a more accurate answer.
// This means the app can open insanely quickly without any weird layout shift.
// Setting `realOs` to true will return a best guess of the underlying operating system instead of 'browser'.
export function useOperatingSystem(realOs) {
    const platform = usePlatform();
    const [os, setOs] = useState(guessOperatingSystem());

    useEffect(() => {
        // Only try to get the real OS if platform.getOs exists
        if (platform.getOs) {
            platform.getOs()
                .then((realOs) => {
                    setOs(realOs);
                })
                .catch(() => {
                    // If there's an error, fall back to the guessed OS
                    setOs(guessOperatingSystem());
                });
        }
    }, [platform.getOs]);

    return platform.platform === 'web' && !realOs ? 'browser' : os;
}
