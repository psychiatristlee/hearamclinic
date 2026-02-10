export function arrayToQueryString(
  params: { [key: string]: string | number }[]
): string {
  const keyValuePairs = params.map((param) =>
    Object.entries(param)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&")
  );

  return `?${keyValuePairs.join("&")}`;
}

export function generateRandomList(totalCount: number) {
  const elements = Array(totalCount / 4)
    .fill(0)
    .concat(Array(totalCount / 4).fill(1))
    .concat(Array(totalCount / 4).fill(2))
    .concat(Array(totalCount / 4).fill(3));

  function shuffle(array: number[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  return shuffle(elements);
}
