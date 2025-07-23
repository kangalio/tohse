import {optimalMoves} from './optimalMoves';
import {Settings} from './types';
import {MS_IN_SECOND} from './constants';

const getNumberAndUnit = (seconds: number) => {
    if (seconds < 60) return {number: seconds, unit: 'seconds'};

    const minutes = (seconds / 60);
    if (minutes < 60) return {number: minutes, unit: 'minutes'};

    const hours = (minutes / 60);
    if (hours < 60) return {number: hours, unit: 'hours'};

    const days = (hours / 24);
    if (days < 365) return {number: days, unit: 'days'};

    const years = (days / 365);
    return {number: years, unit: 'years'};
};

export const formatSeconds = (seconds: number) => {
    const { number, unit } = getNumberAndUnit(seconds);
    return `${number === Infinity ? '∞' : `${number.toFixed(2)} ${unit}`}`;
};

export const estimatedTime = (settings: Settings) => {
    return formatSeconds(optimalMoves(settings) / 3);
};

export const timeDifference = (startTime: number, endTime: number | null) =>
    (((endTime ?? Date.now()) - startTime) / MS_IN_SECOND).toFixed(3);
