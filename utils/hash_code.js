exports.hashCode = (s) => {
  let h;
  for(let i = 0; i < s.length; i++) {
    h = Math.imul(32, h) + s.charCodeAt(i) | 0;
  }
  return h;
}