export const getRGBfromHEX = (
  hex: string,
): readonly [red: number, green: number, blue: number] => {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  console.log(hex, r, g, b);

  return [r, g, b] as const;
};
