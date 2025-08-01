import {isMobileOrTablet} from './isMobileOrTablet';
import {Settings} from './types';
import {optimalMoves} from './optimalMoves';

export const share = async (seconds: number, numMoves: number, numOptimalMoves: number, settings: Settings) =>
    await shareText(
        '⬛⬛🟩⬛⬛' +
        '\n⬛🟦🟦🟦⬛' +
        '\n🟥🟥🟥🟥🟥' +
        '\nTowers of Hanoi - Speedrun Edition Result:' +
        `\n📚 ${settings.disks} disks` +
        `\n⌛ ${seconds.toFixed(3)} seconds` +
        `\n♟️ ${numMoves}/${numOptimalMoves} moves` +
        `\n🚀 ${(optimalMoves(settings) / seconds).toFixed(2)} optimal moves/second` +
        (numMoves === numOptimalMoves ? '\n✨ Optimal solution' : '') +
        (settings.blindfold ? '\n🙈 Blindfolded' : '') +
        (settings.illegalMoves ? '\n🚨 Illegal moves' : '') +
        (!settings.anyEndStack && settings.startStack === settings.endStack ? '\n😞 Cheater' : '')
    );

export const shareText = async (text: string) => {
    // If on mobile, try share first and fall back to copy.
    // If not on mobile, try copy first and fall back to share.
    if (isMobileOrTablet())
        try { await navigatorShare(text); }
        catch { await copyToClipboard(text); }
    else
        try { await copyToClipboard(text); }
        catch { await navigatorShare(text); }
};

const navigatorShare = async (text: string) =>
    await navigator.share({
        title: 'Towers of Hanoi - Speedrun Edition',
        text,
    });

const copyToClipboard = async (text: string) => new Promise((resolve, reject) =>
    navigator.clipboard.writeText(text).then(resolve).catch(() => {
        alert('Sharing failed or was cancelled.');
        reject();
    }));
