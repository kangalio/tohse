import {defaultSettings} from './defaultSettings';

export type Moves = {from: number; to: number; time: number;}[];
export type Replay = {
    date: string;
    time: string;
    settings: Settings;
    moves: Moves;
};
export type Settings = typeof defaultSettings;
