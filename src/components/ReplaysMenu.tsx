import styled from 'styled-components';
import {Button} from './Button';
import {Menu} from './Menu';
import { Replay } from '../util/types';

interface Props {
    replays: Array<Replay>;
}

export const ReplaysMenu = ({replays}: Props) => {
    return (
        <Menu title="Replays">
            <ReplayTable>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Moves</th>
                        <th>Time</th>
                        <th></th>
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
                                <Button onClick={() => {
                                    alert("todo");
                                }}>Replay</Button>
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