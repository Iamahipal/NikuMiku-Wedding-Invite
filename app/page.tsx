import ScrollJourney from '@/components/ScrollJourney';

/**
 * The invitation is one continuous shot, so it is one route. The WebGL canvas
 * and Lenis both live in the layout above this — a page transition would never
 * interrupt the flight.
 */
export default function Page() {
  return <ScrollJourney />;
}
