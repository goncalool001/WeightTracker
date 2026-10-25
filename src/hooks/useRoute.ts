import { useEffect, useState } from 'react';
import type { Route } from '@/types';

/** Hash routes: a static host needs no rewrites, and back/forward just work. */
const ROUTES: Route[] = ['today', 'log', 'goal', 'data'];

export function routeHref(route: Route): string {
  return route === 'today' ? '#/' : `#/${route}`;
}

function read(): Route {
  const name = window.location.hash.replace(/^#\/?/, '').split('?')[0] as Route;
  return ROUTES.includes(name) ? name : 'today';
}

/** The current screen, kept in sync with the URL hash. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(read);

  useEffect(() => {
    const onHash = () => {
      setRoute(read());
      // A new screen starts at its top, and its h1 takes focus for screen readers.
      window.scrollTo(0, 0);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('main h1')?.focus());
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return route;
}
