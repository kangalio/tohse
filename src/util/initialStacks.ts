import { Settings } from "./types";

export function initialStacks(settings: Settings) {
    const stacks = [];
    for (let i = 0; i < settings.stacks; ++i) stacks.push([]);
    stacks[Math.min(settings.startStack, settings.stacks) - 1] = Array.from({length: settings.disks}, (_, i) => i + 1);
    return stacks;
}