export const FESTIVAL_DAYS = [
  {
    day: 0,
    title: 'Day 0',
    passId: 'day-pass-0',
    events: [
      { title: 'Group Dance', ids: ['group-dance'] },
    ],
  },
  {
    day: 1,
    title: 'Day 1',
    passId: 'day-pass-1',
    events: [
      { title: 'Battle of Bands', ids: ['battle-of-bands'] },
      { title: 'Solo Dance & Solo Singing', ids: ['solo-dance', 'solo-singing'] },
      { title: 'Mock Shark Tank & Anime Quiz', ids: ['mocksharktank', 'anime-quiz'] },
      { title: 'Literary Hackathon', ids: ['literary-hackathon'] },
      { title: 'Theme Mystery, Escape Room & Laser Tag', ids: ['theme-mystery', 'escape-room', 'laser-tag', 'cricket-bowling'] },
      { title: 'BGMI & Short Film', ids: ['bgmi', 'short-film'] },
    ],
  },
  {
    day: 2,
    title: 'Day 2',
    passId: 'day-pass-2',
    events: [
      { title: 'Fashion Show', ids: ['fashion-show'] },
      { title: 'Instrumentals & Mono Acting', ids: ['instrumentals', 'mono-acting'] },
      { title: 'Cricket Auction & Painting', ids: ['cricketauction', 'painting'] },
      { title: 'Creative Journalism & Group Discussion', ids: ['creative-journalism', 'group-discussion'] },
      { title: 'Treasure Hunt, Theme Mystery & Escape Room', ids: ['treasure-hunt', 'theme-mystery', 'escape-room', 'laser-tag', 'cricket-bowling'] },
      { title: 'BGMI, Free Fire, Clash Royale & Photography', ids: ['bgmi', 'ff', 'clashroyale', 'photography'] },
      { title: 'Origami', ids: ['origami'] },
      { title: 'Spell Bee', ids: ['spell-bee'] },
      { title: 'Escape Room, Laser Tag & Cricket Bowling', ids: ['escape-room', 'laser-tag', 'cricket-bowling'] },
      { title: 'Free Fire & Reel/Meme Making', ids: ['ff', 'reel-and-meme-making'] },
    ],
  },
];

export const DAY_PASSES = FESTIVAL_DAYS.map(({ day, title, passId }) => ({
  id: passId,
  day,
  title: `${title} Pass`,
  ticketId: 3509 + day,
  price: 150,
  priceLabel: '₹150',
}));
