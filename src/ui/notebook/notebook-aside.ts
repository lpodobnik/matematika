// Whether the phone's notebook shows pushed aside (story 1.14 review fix). On a phone the
// notebook slides over the scene's right part, where a pin's right answers and its confirm
// control often are. While a pin waits to be confirmed the notebook is off anyway, so it
// shows pushed aside then, without touching his own choice (`ui.notebookAside`): once the
// pin is confirmed it shows as he had it. He can still bring it back with the handle while
// the pin waits; that holds until the next pin. The tablet layout ignores all of this.

/**
 * Shown aside: his choice, or while the pin of stage `waiting` (`r03.1`) waits, unless he
 * brought the notebook back during that very pin (`broughtBack`).
 */
export function shownAside(
  choice: boolean,
  waiting: string | null,
  broughtBack: string | null,
): boolean {
  return choice || (waiting !== null && waiting !== broughtBack);
}

/** His choice and the pin he brought the notebook back for, after a press on the handle. */
export interface AsideState {
  choice: boolean;
  broughtBack: string | null;
}

/**
 * A press on the handle: shown aside, it brings the notebook back, as his choice and for
 * the waiting pin too; shown over the scene, it pushes it aside, as his choice, or, while a
 * pin waits, only for that pin, so his choice stays.
 */
export function pressHandle(state: AsideState, waiting: string | null): AsideState {
  if (shownAside(state.choice, waiting, state.broughtBack)) {
    return { choice: false, broughtBack: waiting };
  }
  if (waiting !== null) return { choice: state.choice, broughtBack: null };
  return { choice: true, broughtBack: state.broughtBack };
}
