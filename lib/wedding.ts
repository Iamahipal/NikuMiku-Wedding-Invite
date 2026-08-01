/**
 * Single source of truth for every piece of copy on the invitation.
 * Swap these values and the whole film re-casts itself.
 */
export const couple = {
  bride: 'Niku',
  groom: 'Miku',
  hashtag: '#NikuWedsMiku',
  date: '14 . 02 . 2027',
  city: 'Udaipur, Rajasthan',
};

export type WeddingEvent = {
  id: string;
  index: string;
  name: string;
  script: string; // Devanagari title
  date: string;
  time: string;
  venue: string;
  dress: string;
  blurb: string;
  accent: string; // per-card gold temperature
};

export const events: WeddingEvent[] = [
  {
    id: 'haldi',
    index: '01',
    name: 'Haldi',
    script: 'हल्दी',
    date: 'Friday, 12 February',
    time: '10:00 AM onwards',
    venue: 'The Marigold Courtyard, Villa Vedanta',
    dress: 'Shades of turmeric & marigold',
    blurb:
      'Morning light, turmeric on skin, drums that start before the sun is properly up.',
    accent: '#F5C563',
  },
  {
    id: 'sangeet',
    index: '02',
    name: 'Sangeet',
    script: 'संगीत',
    date: 'Saturday, 13 February',
    time: '8:00 PM onwards',
    venue: 'The Mirror Hall, Jag Mandir',
    dress: 'Midnight & metallics',
    blurb:
      'Two families, one dance floor, and a rehearsal that nobody actually rehearsed.',
    accent: '#E8B24C',
  },
  {
    id: 'wedding',
    index: '03',
    name: 'The Wedding',
    script: 'विवाह',
    date: 'Sunday, 14 February',
    time: 'Muhurat at 9:40 PM',
    venue: 'The Lake Pavilion, City Palace',
    dress: 'Traditional formal',
    blurb:
      'Seven steps, one fire, and the quietest loudest moment of our lives.',
    accent: '#D9A441',
  },
  {
    id: 'reception',
    index: '04',
    name: 'Reception',
    script: 'स्वागत',
    date: 'Monday, 15 February',
    time: '7:30 PM onwards',
    venue: 'The Terrace, Zenana Mahal',
    dress: 'Black tie, gold heart',
    blurb:
      'Champagne over the water, and the first evening we get to be introduced as two.',
    accent: '#C89B3F',
  },
];
