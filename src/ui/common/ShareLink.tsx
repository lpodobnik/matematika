import '@/ui/common/share-link.css';
import { useRef, useState } from 'react';
import { hr } from '@/content/text/hr';

/**
 * A link to pass on (epic 5; architecture, Pattern 3, Sharing): the native share sheet where
 * the browser has one, a copy button, and the link itself as text he can select. Buttons at
 * least 48 CSS px (share-link.css).
 */
export function ShareLink({ url, text, kind }: { url: string; text: string; kind: string }) {
  const field = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // No clipboard (an insecure page, or refused): select the text for a long press.
      field.current?.select();
    }
  }

  async function share() {
    try {
      await navigator.share({ title: text, text, url });
    } catch {
      // Closed without sharing.
    }
  }

  return (
    <div className="share-link" data-link={kind}>
      <input
        ref={field}
        className="share-link__url"
        readOnly
        value={url}
        aria-label={hr.workshop.link}
        onFocus={(event) => event.currentTarget.select()}
      />
      <div className="share-link__buttons">
        {canShare && (
          <button type="button" className="share-link__button" onClick={share}>
            {hr.workshop.share}
          </button>
        )}
        <button type="button" className="share-link__button" onClick={copy}>
          {copied ? hr.workshop.copied : hr.workshop.copy}
        </button>
      </div>
    </div>
  );
}
