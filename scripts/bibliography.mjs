// Read the braced/quoted BibTeX fields used by this site's existing bibliography.
// Fail loudly on malformed input instead of silently dropping a publication.
export function parseBibliography(source) {
  const entries = [];
  const start = /@(\w+)\s*\{\s*([^,]+),/g;
  let match;
  while ((match = start.exec(source))) {
    let pos = start.lastIndex;
    const fields = {};
    while (pos < source.length) {
      while (/[\s,]/.test(source[pos] || '') && pos < source.length) pos++;
      if (source[pos] === '}') { pos++; break; }
      const key = /^[\w-]+/.exec(source.slice(pos));
      if (!key) throw Error(`Invalid BibTeX field at ${pos} in ${match[2]}`);
      pos += key[0].length;
      while (/\s/.test(source[pos] || '') && pos < source.length) pos++;
      if (source[pos++] !== '=') throw Error(`Missing '=' in ${match[2]}`);
      while (/\s/.test(source[pos] || '') && pos < source.length) pos++;
      let value = '';
      if (source[pos] === '{') {
        let depth = 1; pos++;
        while (depth && pos < source.length) {
          const char = source[pos++];
          if (char === '\\') { value += char + (source[pos++] || ''); continue; }
          if (char === '{') depth++;
          if (char === '}') depth--;
          if (depth) value += char;
        }
        if (depth) throw Error(`Unclosed field in ${match[2]}`);
      } else if (source[pos] === '"') {
        pos++;
        while (pos < source.length && source[pos] !== '"') {
          const char = source[pos++]; value += char;
          if (char === '\\') value += source[pos++] || '';
        }
        if (source[pos++] !== '"') throw Error(`Unclosed quote in ${match[2]}`);
      } else {
        while (pos < source.length && !/[,}]/.test(source[pos])) value += source[pos++];
      }
      fields[key[0].toLowerCase()] = value.trim();
    }
    if (!fields.title || !fields.author || !fields.year) throw Error(`Incomplete publication: ${match[2]}`);
    entries.push({ id: match[2].trim(), type: match[1], fields });
    start.lastIndex = pos;
  }
  if (!entries.length) throw Error('The bibliography contains no publications');
  return entries;
}
