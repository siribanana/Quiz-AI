// Curated topics for the "lacking inspiration?" button — a fixed list so
// re-rolling is instant and free (no API call). Mix of plain trivia topics
// and explicit ranked-list phrasing, deliberately agnostic to whichever
// quiz mode is currently selected.
export const EXAMPLE_TOPICS: string[] = [
  "the 10 tallest mountains in the world",
  "the 5 most decorated Olympians of all time",
  "capital cities of Europe",
  "famous paintings of the Renaissance",
  "the periodic table's first 20 elements",
  "the 10 longest rivers in the world",
  "US presidents of the 20th century",
  "the most-watched TV shows of all time",
  "the 7 wonders of the ancient world",
  "Nobel Prize winners in Physics",
  "the 10 best-selling video games of all time",
  "moons of the solar system",
  "the FIFA World Cup winners since 1990",
  "famous shipwrecks in history",
  "the 10 largest countries by population",
  "iconic rock bands of the 1970s",
  "the deepest places on Earth",
  "the 5 most populous cities in Asia",
  "ancient wonders still standing today",
  "the greatest tennis grand slam champions",
  "dinosaur species by size",
  "the 10 most spoken languages in the world",
  "space missions that landed on the Moon",
  "famous unsolved mysteries",
  "the tallest buildings in the world",
  "the 10 highest-grossing movies of all time",
  "key battles of World War II",
  "the most venomous animals on Earth",
  "the 5 largest deserts in the world",
  "legendary explorers and their voyages",
  "the top 10 fastest animals on land",
  "Grammy Award winners for Album of the Year",
  "famous ancient civilizations",
  "the 10 coldest places on Earth",
  "iconic video game consoles through history",
  "the most decorated military medals",
];

// Shifts by one on a collision instead of re-rolling in a loop — O(1) and
// guarantees no immediate repeat.
export function pickRandomTopicIndex(excludeIndex: number | null): number {
  if (EXAMPLE_TOPICS.length <= 1) return 0;
  const index = Math.floor(Math.random() * EXAMPLE_TOPICS.length);
  return index === excludeIndex ? (index + 1) % EXAMPLE_TOPICS.length : index;
}
