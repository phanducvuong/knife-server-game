exports.getStringGenerate = () => {
  const hrtime        = process.hrtime();
  let   microSeconds  = parseInt(((hrtime[0] * 1e6) + (hrtime[1]) * 1e-3));
  let   decimal       = parseInt(microSeconds % 10000000000, 10);

  let remainder       = 0;
  let deckChar        = '';
  let char = ['1','2','3','4','5','6','7','8','9',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  while(decimal > 0) {
    remainder = parseInt(decimal % 33, 10);
    deckChar  = char[remainder] + deckChar;
    decimal   = parseInt(decimal / 33, 10);
  }
  return deckChar;
}