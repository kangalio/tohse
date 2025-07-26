export const abortableSleep = (secs: number, signal?: AbortSignal): Promise<void> => {
    return new Promise(resolve => {
        const timeoutId = setTimeout(resolve, secs * 1000);
        
        if (signal) {
            signal.addEventListener('abort', () => {
                clearTimeout(timeoutId);
                resolve();
            }, { once: true });
        }
    });
}