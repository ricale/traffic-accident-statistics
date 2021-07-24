function hexToRgba(hex: string, a: number) {
  const rgbNumbers = (
    hex.length === 7 ?
      [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5), 16),
      ] :
      [
        parseInt(hex[1].repeat(2), 16),
        parseInt(hex[2].repeat(2), 16),
        parseInt(hex[3].repeat(2), 16),
      ]
  );

  return `rgba(${rgbNumbers.join(',')},${a})`;
}

function rgb(rgba: string, a: number) {
  return rgba.replace(/,[0-9.]+\)$/, `,${a})`);
}
function rgba4(r: number, g: number, b: number, a: number) {
  return `rgba(${r},${g},${b},${a ?? 1})`;
}

function rgba(rgbaOrHex: string, a: number): string;
function rgba(r: number, g: number, b: number, a: number): string;
function rgba(...args: unknown[]): string {
  if(typeof args[0] === 'string') {
    if(args[0].match(/^rgba/)) {
      return rgb(args[0], args[1] as number);
    } else {
      return hexToRgba(args[0], args[1] as number)
    }
  }
  return rgba4(args[0] as number, args[1] as number, args[2] as number, args[3] as number);
}

export default rgba;
