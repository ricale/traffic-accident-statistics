function fillWithZero(n: number, digit = 2) {
  const len = `${n}`.length;
  if(len >= digit) {
    return `${n}`;
  } else {
    return `${'0'.repeat(digit - len)}${n}`;
  }
}

export default fillWithZero;
