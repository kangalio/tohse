import styled from 'styled-components';
import {Button} from './Button';
import {Menu} from './Menu';
import { Replay } from '../util/types';
import { calculateStats } from '../util/calculateStats';

interface Props {
    replays: Array<Replay>;
    clickable: {
        replayInProgress: false,
        startReplay: (replay: Replay) => void;
    } | {
        replayInProgress: true,
        stopReplay: () => void;
    };
}

export const ReplaysMenu = ({replays, clickable}: Props) => {
    return (
        <Menu title="Replays">
            <ReplayTable>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Moves</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {replays.map((replay, index) => (
                        <tr key={index}>
                            <td>
                                {replay.time}<br/>
                                {replay.date}
                            </td>
                            <td>
                                {replay.moves.length}/{Math.pow(2, replay.settings.disks) - 1} moves<br/>
                                {replay.settings.disks} disks
                            </td>
                            <td>
                                {replay.moves[replay.moves.length - 1].time.toFixed(1)}s <br/>
                                {(replay.moves.length / replay.moves[replay.moves.length - 1].time).toFixed(1)} moves/s
                            </td>
                            <td>
                                {clickable.replayInProgress ?
                                    <Button onClick={() => clickable.stopReplay()}>Stop</Button> :
                                    <Button onClick={() => clickable.startReplay(replay)}>Replay</Button>}
                            </td>
                            <td>
                                <Button onClick={() => alert(calculateStats(replay))}>?</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </ReplayTable>
        </Menu>
    );
};

const ReplayTable = styled.table`
    text-align: center;
    td {
        padding: 5px;
    }
`;