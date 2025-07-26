export const abortableSleep = (secs: number, signal?: AbortSignal): Promise<void> | void => {
    if (secs <= 0) return;
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