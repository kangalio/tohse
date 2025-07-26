export const abortableSleep = (secs: number, signal?: AbortSignal): Promise<void> => {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, secs * 1000);
        
        if (signal) {
            signal.addEventListener('abort', () => {
                clearTimeout(timeoutId);
                reject(new Error('Sleep aborted'));
            }, { once: true });
        }
    });
}