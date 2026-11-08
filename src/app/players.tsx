// "Tko igra?" as main.tsx opens it, in place of the game or Luka's view: the list on the device
// and what the board's buttons do to it. Nothing here runs with the game, so it never reads a
// save the game is writing.

import { useState } from 'react';
import { hr } from '@/content/text/hr';
import {
  createPlayer,
  deletePlayer,
  listPlayers,
  nextPlayerId,
  rememberedPlayer,
  restartPlayer,
} from '@/save/players';
import { PlayersBoard } from '@/ui/players/PlayersScreen';

/** What the list is for: the game, or Luka picking whose log or whose backup. */
export type PlayersMode = 'game' | 'log' | 'restore';

export function PlayersApp({ mode, onChosen }: { mode: PlayersMode; onChosen(id: string): void }) {
  const [players, setPlayers] = useState(listPlayers);
  const refresh = (done: boolean) => {
    setPlayers(listPlayers());
    return done;
  };
  const remembered = rememberedPlayer();
  const back = players.some((player) => player.id === remembered) ? remembered : null;
  const title = {
    game: hr.players.title,
    log: hr.players.titleLog,
    restore: hr.players.titleRestore,
  };
  return (
    <div className="app">
      <PlayersBoard
        title={title[mode]}
        players={players}
        onPick={onChosen}
        onNew={
          mode === 'game'
            ? () => onChosen(createPlayer())
            : // The backup makes the save; declining it leaves nobody new behind.
              mode === 'restore'
              ? () => onChosen(nextPlayerId())
              : undefined
        }
        onBack={mode === 'game' && back ? () => onChosen(back) : undefined}
        manage={
          mode === 'game'
            ? {
                onRestart: (id) => refresh(restartPlayer(id)),
                onRemove: (id) => refresh(deletePlayer(id)),
              }
            : undefined
        }
      />
    </div>
  );
}
