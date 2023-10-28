// Process escaped chars and hardbreaks

import { Token } from '../../basic/token';
import { Rule } from '../../interface';
import { isSpace } from '../../utils/utils';

const ESCAPED: number[] = [];

for (let i = 0; i < 256; i++) {
  ESCAPED.push(0);
}

'\\!"#$%&\'()*+,./:;<=>?@[]^_`{|}~-'.split('').forEach(function (ch) {
  ESCAPED[ch.charCodeAt(0)] = 1;
});

/** Process escaped chars and hardbreaks */
export default (function escape(state, silent) {
  let ch1,
    ch2,
    origStr,
    escapedStr,
    token: Token,
    pos = state.pos,
    max = state.posMax;

  if (state.src.charCodeAt(pos) !== 0x5c /* \ */) return false;
  pos++;

  // '\' at the end of the inline block
  if (pos >= max) return false;

  ch1 = state.src.charCodeAt(pos);

  if (ch1 === 0x0a) {
    if (!silent) {
      state.push('hardbreak', 'br', 0);
    }

    pos++;
    // skip leading whitespaces from next line
    while (pos < max) {
      ch1 = state.src.charCodeAt(pos);
      if (!isSpace(ch1)) break;
      pos++;
    }

    state.pos = pos;
    return true;
  }

  escapedStr = state.src[pos];

  if (ch1 >= 0xd800 && ch1 <= 0xdbff && pos + 1 < max) {
    ch2 = state.src.charCodeAt(pos + 1);

    if (ch2 >= 0xdc00 && ch2 <= 0xdfff) {
      escapedStr += state.src[pos + 1];
      pos++;
    }
  }

  origStr = '\\' + escapedStr;

  if (!silent) {
    token = state.push('text_special', '', 0);

    if (ch1 < 256 && ESCAPED[ch1] !== 0) {
      token.content = escapedStr;
    } else {
      token.content = origStr;
    }

    token.markup = origStr;
    token.info = 'escape';
  }

  state.pos = pos + 1;
  return true;
} as Rule.InlineRule['fn']);
