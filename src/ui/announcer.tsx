// SPDX-License-Identifier: EUPL-1.2
import { createContext, use, useCallback, useState, type ReactNode } from 'react';

export type Politeness = 'polite' | 'assertive';
type Announce = (message: string, politeness?: Politeness) => void;

const AnnounceContext = createContext<Announce>(() => undefined);

// A trailing no-break space makes a repeated message a text change, so it is read again.
const toggle = (previous: string, message: string) =>
  previous === message ? `${message}\u00a0` : message;

/** Live regions present from the first render, so screen readers pick up every later message. */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');

  const announce = useCallback<Announce>((message, politeness = 'polite') => {
    (politeness === 'assertive' ? setAssertive : setPolite)((previous) =>
      toggle(previous, message),
    );
  }, []);

  return (
    <AnnounceContext value={announce}>
      {children}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div className="visually-hidden" role="alert" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </AnnounceContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export const useAnnounce = () => use(AnnounceContext);
