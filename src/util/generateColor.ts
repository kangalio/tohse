type Color = [number, number, number];

let breakpoints = [
    { color: [1, 0, 0] satisfies Color, distanceToNext: 9 }, // red
    { color: [1, 1, 0] satisfies Color, distanceToNext: 4 }, // yellow
    { color: [0, 1, 0] satisfies Color, distanceToNext: 2 }, // green
    { color: [0, 1, 1] satisfies Color, distanceToNext: 14 }, // cyan
    { color: [0, 0, 1] satisfies Color, distanceToNext: 9 }, // blue
    { color: [1, 0, 1] satisfies Color, distanceToNext: 1 }, // magenta
];
let totalPathLength = breakpoints.reduce(
    (sum, bp) => sum + bp.distanceToNext,
    0
);

function lerpColor(a: Color, b: Color, t: number): Color {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    ];
}

export function generateColor(color0To1: number): string {
    let pathPosition = (color0To1 % 1) * totalPathLength;

    let i = 0;
    while (pathPosition >= breakpoints[i].distanceToNext) {
        pathPosition -= breakpoints[i].distanceToNext;
        i++;
    }

    let color = lerpColor(
        breakpoints[i].color,
        breakpoints[(i + 1) % breakpoints.length].color,
        pathPosition / breakpoints[i].distanceToNext
    );
    return `rgb(${color.map((c) => Math.round(c * 255)).join(', ')})`;
}
