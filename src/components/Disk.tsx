import styled from 'styled-components';
import { generateColor } from '../util/generateColor';

interface Props {
    $width: number;
    $height: number;
    $color: number;
    $holding?: boolean;
}

export const Disk = styled.div.attrs<Props>(({ $color, $width, $height }) => ({
    // If these were set normally in the CSS below, over 200 classes
    // would be generated for each color/width/height combination.
    style: {
        backgroundColor: generateColor($color),
        width: `${$width}px`,
        height: `${$height}px`,
    },
}))<Props>`
    border-radius: 10px;
    margin: ${p => (p.$holding ? '20px' : 'auto')} auto auto auto;
    font-size: ${p => p.$height - 10}px;
    // -webkit-text-stroke causes artifacts https://stackoverflow.com/q/76915835/9946772
    text-shadow: 
        -1px -1px 0 #000,  
        1px -1px 0 #000,
        -1px 1px 0 #000,
        1px 1px 0 #000;
    display: flex;
    justify-content: center;
    align-items: center;
`;
