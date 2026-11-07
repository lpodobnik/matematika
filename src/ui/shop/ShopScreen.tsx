import '@/ui/shop/shop.css';
import type { ReactNode } from 'react';
import { hr } from '@/content/text/hr';
import type { Economy, UpgradeId } from '@/economy/types';
import { UPGRADE_IDS, upgradeCost } from '@/economy/upgrades';
import { useGame } from '@/store/store';
import { PartsCounterView } from '@/ui/common/PartsCounter';
import { WorkshopWall } from '@/ui/workshop/WorkshopWall';

/**
 * The old mechanic's counter (story 3.5; GDD, Automaton fights: upgrades; narrative design,
 * the old mechanic). Three upgrades with what they do and their cost in parts, each bought
 * once with unspent parts. HTML like the map and the fight.
 */
export function ShopScreen() {
  const economy = useGame((s) => s.save.economy);
  const dispatch = useGame((s) => s.dispatch);
  return (
    <ShopBoard
      economy={economy}
      onBuy={(upgrade) => dispatch({ type: 'shop/buy', upgrade })}
      onClose={() => dispatch({ type: 'shop/close' })}
    >
      <WorkshopWall />
    </ShopBoard>
  );
}

/** What an upgrade's button can do now. */
export type Offer = 'owned' | 'buy' | 'short';

export function offerOf(economy: Pick<Economy, 'parts' | 'upgrades'>, id: UpgradeId): Offer {
  if (economy.upgrades.includes(id)) return 'owned';
  return economy.parts >= upgradeCost(id) ? 'buy' : 'short';
}

interface Props {
  economy: Pick<Economy, 'parts' | 'upgrades'>;
  onBuy(upgrade: UpgradeId): void;
  onClose(): void;
  /** Epic 5: the workshop's half of the counter, under the upgrades. */
  children?: ReactNode;
}

/** The counter from props only. */
export function ShopBoard({ economy, onBuy, onClose, children }: Props) {
  return (
    <main className="shop" aria-label={hr.shop.title}>
      <header className="shop__head">
        <button type="button" className="shop__back" onClick={onClose}>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M20 6 L10 16 L20 26" />
          </svg>
          {hr.shop.back}
        </button>
        <h1 className="shop__title">{hr.shop.title}</h1>
      </header>
      <p className="shop__speech">
        <b>{hr.shop.speaker}:</b> {hr.shop.line}
      </p>
      <ul className="shop__list">
        {UPGRADE_IDS.map((id) => {
          const offer = offerOf(economy, id);
          const cost = upgradeCost(id);
          const label =
            offer === 'owned'
              ? hr.shop.owned
              : offer === 'short'
                ? hr.shop.short(cost - economy.parts)
                : hr.shop.buy;
          return (
            <li key={id} className="shop__item" data-upgrade={id} data-offer={offer}>
              <UpgradeIcon id={id} />
              <div className="shop__text">
                <h2 className="shop__name">{hr.shop.upgrades[id].name}</h2>
                <p className="shop__what">{hr.shop.upgrades[id].what}</p>
              </div>
              <span className="shop__cost">{hr.shop.cost(cost)}</span>
              <button
                type="button"
                className="shop__buy"
                disabled={offer !== 'buy'}
                aria-label={`${hr.shop.upgrades[id].name}: ${label}`}
                onClick={() => onBuy(id)}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>
      {children}
      <PartsCounterView shown={economy.parts} visible flight={null} />
    </main>
  );
}

/** Each upgrade's sign, drawn in code until epic 6's art. */
function UpgradeIcon({ id }: { id: UpgradeId }) {
  return (
    <svg className="shop__icon" viewBox="-30 -30 60 60" aria-hidden="true">
      {id === 'fourth-die' && (
        <g>
          <rect x="-26" y="-26" width="24" height="24" rx="5" />
          <rect x="2" y="-26" width="24" height="24" rx="5" />
          <rect x="-26" y="2" width="24" height="24" rx="5" />
          <rect x="2" y="2" width="24" height="24" rx="5" className="shop__icon-new" />
        </g>
      )}
      {id === 'steam' && (
        <g>
          <path d="M-14 24 V0 H14 V24 Z M-6 0 V-8 H6 V0" />
          <path d="M-10 -14 Q-16 -20 -10 -26 M0 -14 Q-6 -20 0 -26 M10 -14 Q4 -20 10 -26" />
        </g>
      )}
      {id === 'hull' && (
        <g>
          <rect x="-24" y="-12" width="14" height="24" rx="3" />
          <rect x="-7" y="-12" width="14" height="24" rx="3" />
          <rect x="10" y="-12" width="14" height="24" rx="3" className="shop__icon-new" />
        </g>
      )}
    </svg>
  );
}
