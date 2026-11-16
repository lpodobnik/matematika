import { type SketchId, secrets } from '@/content/secrets';
import { hr } from '@/content/text/hr';
import { gearCost, lookCost, type ShopGearId, shopGear } from '@/hunt/gear';
import { type LookPieceId, lookPieceIds, type SecretId } from '@/hunt/ids';
import type { CompanionSave } from '@/hunt/types';
import { LittleOneArt } from '@/ui/hunt/LittleOne';
import { sketchArt } from '@/ui/shop/sketch-art';

const text = hr.hunt.growth;

/**
 * Part 2's half of Faust's counter (epic 11): gear and looks for the little one, bought with
 * parts, and the wall of Kristijan's papers from the caches he has found. The little one shows
 * what it wears as he buys and changes it.
 */
export function LittleOneShop({
  parts,
  companion,
  found,
  onBuyGear,
  onBuyLook,
  onWear,
}: {
  parts: number;
  companion: CompanionSave;
  found: readonly SecretId[];
  onBuyGear(gear: ShopGearId): void;
  onBuyLook(look: LookPieceId): void;
  onWear(look: LookPieceId): void;
}) {
  const label = (cost: number, owned: boolean) =>
    owned ? hr.shop.owned : parts >= cost ? hr.shop.buy : hr.shop.short(cost - parts);
  return (
    <section className="shop__little" aria-label={text.shop.head}>
      <h2 className="shop__head-line">{text.shop.head}</h2>
      <div className="shop__little-top">
        <span className="shop__little-figure">
          <LittleOneArt wearing={companion.wearing} gear={companion.gear} />
        </span>
        <p className="shop__speech">
          <b>{hr.shop.speaker}:</b> {text.shop.line}
        </p>
      </div>
      <h3 className="shop__sub">{text.shop.gearHead}</h3>
      <ul className="shop__list">
        {shopGear.map((id) => {
          const cost = gearCost(id);
          const owned = companion.gear.includes(id);
          const offer = owned ? 'owned' : parts >= cost ? 'buy' : 'short';
          return (
            <li key={id} className="shop__item" data-gear={id} data-offer={offer}>
              <span className="shop__icon shop__icon--little">
                <LittleOneArt gear={[id]} />
              </span>
              <div className="shop__text">
                <h4 className="shop__name">{text.shop.gear[id].name}</h4>
                <p className="shop__what">{text.shop.gear[id].what}</p>
              </div>
              <span className="shop__cost">{hr.shop.cost(cost)}</span>
              <button
                type="button"
                className="shop__buy"
                disabled={offer !== 'buy'}
                aria-label={`${text.shop.gear[id].name}: ${label(cost, owned)}`}
                onClick={() => onBuyGear(id)}
              >
                {label(cost, owned)}
              </button>
            </li>
          );
        })}
      </ul>
      <h3 className="shop__sub">{text.shop.looksHead}</h3>
      <ul className="shop__looks">
        {lookPieceIds.map((id) => {
          const cost = lookCost(id);
          const owned = companion.looks.includes(id);
          const worn = companion.wearing.includes(id);
          const offer = owned ? 'owned' : parts >= cost ? 'buy' : 'short';
          const action = owned ? (worn ? text.shop.takeOff : text.shop.wear) : label(cost, false);
          return (
            <li key={id} className="shop__look" data-look={id} data-offer={offer} data-worn={worn}>
              <span className="shop__look-figure">
                <LittleOneArt wearing={[id]} />
              </span>
              <span className="shop__look-name">{text.shop.looks[id]}</span>
              {!owned && <span className="shop__cost">{hr.shop.cost(cost)}</span>}
              <button
                type="button"
                className="shop__buy"
                disabled={offer === 'short'}
                aria-pressed={owned ? worn : undefined}
                aria-label={`${text.shop.looks[id]}: ${action}`}
                onClick={() => (owned ? onWear(id) : onBuyLook(id))}
              >
                {action}
              </button>
            </li>
          );
        })}
      </ul>
      <Papers found={found} />
    </section>
  );
}

/** The workshop wall's papers from Kristijan's caches, in the order of the town's caches. */
function Papers({ found }: { found: readonly SecretId[] }) {
  const papers = secrets.filter((secret) => found.includes(secret.id));
  return (
    <section className="papers" aria-label={text.secrets.wall}>
      <h3 className="shop__sub">
        {text.secrets.wall}{' '}
        <span className="papers__count">{text.secrets.count(papers.length, secrets.length)}</span>
      </h3>
      {papers.length === 0 ? (
        <p className="shop__what">{text.secrets.wallEmpty}</p>
      ) : (
        <ul className="papers__list">
          {papers.map((secret) => (
            <li key={secret.id} className="papers__paper" data-secret={secret.id}>
              <Paper id={secret.id} sketch={secret.sketch} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** One of Kristijan's papers: his sketch, if it is one, its title and his line. */
export function Paper({ id, sketch }: { id: SecretId; sketch: SketchId | null }) {
  const paper = text.secrets.papers[id];
  const art = sketch ? sketchArt[sketch] : undefined;
  return (
    <>
      {art && <img className="papers__sketch" src={art} alt="" draggable={false} />}
      <h4 className="papers__title">{paper.title}</h4>
      <p className="papers__line">{paper.line}</p>
    </>
  );
}
