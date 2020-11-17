exports.getStringGenerate = () => {
  const hrtime        = process.hrtime();
  // let   microSeconds  = parseInt(((h[0] * 1e6) + (h[1]) * 1e-3));
  let   microSeconds  = (hrtime[0] * 1e9) + hrtime[1];
  let   decimal       = parseInt(microSeconds % 1000000000, 10);

  let remainder       = 0;
  let deckChar        = '';
  let chars           = ['1','2','3','4','5','6','7','8','9','A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  decimal = pad(decimal);
  
  while(decimal > 0) {
    remainder = parseInt(decimal % chars.length, 10);
    deckChar  = chars[remainder] + deckChar;
    decimal   = parseInt(decimal / chars.length, 10);
  }
  return deckChar;
}

function pad(inp) {
  let tmpInp = inp + '';
  while (tmpInp.length < 9) {
    let rnd = Math.round(Math.random() * 9);
    tmpInp += rnd;
  }
  return parseInt(tmpInp, 10);
}