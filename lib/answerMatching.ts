export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(the|a|an)\s+/, "");
}

export function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dist: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i++) dist[i][0] = i;
  for (let j = 0; j < cols; j++) dist[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(
        dist[i - 1][j] + 1,
        dist[i][j - 1] + 1,
        dist[i - 1][j - 1] + cost
      );
    }
  }

  return dist[rows - 1][cols - 1];
}

function typoThreshold(normalized: string): number {
  if (normalized.length <= 4) return 0;
  if (normalized.length <= 8) return 1;
  return 2;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function checkAnswer(
  userInput: string,
  canonicalAnswer: string,
  acceptableAnswers: string[]
): boolean {
  const normUser = normalize(userInput);
  if (!normUser) return false;

  const variants = [canonicalAnswer, ...acceptableAnswers].map(normalize).filter(Boolean);

  return variants.some((variant) => {
    if (normUser === variant) return true;
    if (levenshtein(normUser, variant) <= typoThreshold(variant)) return true;
    if (variant.length > 2) {
      const re = new RegExp(`\\b${escapeRegExp(variant)}\\b`);
      if (re.test(normUser)) return true;
    }
    return false;
  });
}
