// Process html tags

import { Token } from '../../basic/token';
import { HTML_TAG_RE } from '../../common/html_re';
import { Rule } from '../../interface';

function isLinkOpen(str) {
  return /^<a[>\s]/i.test(str);
}
function isLinkClose(str) {
  return /^<\/a\s*>/i.test(str);
}

function isLetter(ch) {
  /*eslint no-bitwise:0*/
  let lc = ch | 0x20; // to lower case
  return lc >= 0x61 /* a */ && lc <= 0x7a /* z */;
}

/** Process html tags */
export default (function html_inline(state, silent) {
  let ch,
    match,
    max,
    token: Token,
    pos = state.pos;

  if (!state.md.options.html) {
    return false;
  }

  // Check start
  max = state.posMax;
  if (state.src.charCodeAt(pos) !== 0x3c /* < */ || pos + 2 >= max) {
    return false;
  }

  // Quick fail on second char
  ch = state.src.charCodeAt(pos + 1);
  if (ch !== 0x21 /* ! */ && ch !== 0x3f /* ? */ && ch !== 0x2f /* / */ && !isLetter(ch)) {
    return false;
  }

  match = state.src.slice(pos).match(HTML_TAG_RE);
  if (!match) {
    return false;
  }

  if (!silent) {
    token = state.push('html_inline', '', 0);
    token.content = match[0];

    if (isLinkOpen(token.content)) state.linkLevel++;
    if (isLinkClose(token.content)) state.linkLevel--;
  }
  state.pos += match[0].length;
  return true;
} as Rule.InlineRule['fn']);
