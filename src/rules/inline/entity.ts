// Process html entity - &#123;, &#xAF;, &quot;, ...

import { Token } from '../../basic/token';
import entities from '../../common/entities';
import { Rule } from '../../interface';
import { fromCodePoint, has, isValidEntityCode } from '../../utils/utils';

const DIGITAL_RE = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
const NAMED_RE = /^&([a-z][a-z0-9]{1,31});/i;

/** Process html entity - &#123;, &#xAF;, &quot;, ... */
export default (function entity(state, silent) {
  let ch,
    code,
    match,
    token: Token,
    pos = state.pos,
    max = state.posMax;

  if (state.src.charCodeAt(pos) !== 0x26 /* & */) return false;

  if (pos + 1 >= max) return false;

  ch = state.src.charCodeAt(pos + 1);

  if (ch === 0x23 /* # */) {
    match = state.src.slice(pos).match(DIGITAL_RE);
    if (match) {
      if (!silent) {
        code = match[1][0].toLowerCase() === 'x' ? parseInt(match[1].slice(1), 16) : parseInt(match[1], 10);

        token = state.push('text_special', '', 0);
        token.content = isValidEntityCode(code) ? fromCodePoint(code) : fromCodePoint(0xfffd);
        token.markup = match[0];
        token.info = 'entity';
      }
      state.pos += match[0].length;
      return true;
    }
  } else {
    match = state.src.slice(pos).match(NAMED_RE);
    if (match) {
      if (has(entities, match[1])) {
        if (!silent) {
          token = state.push('text_special', '', 0);
          token.content = entities[match[1]];
          token.markup = match[0];
          token.info = 'entity';
        }
        state.pos += match[0].length;
        return true;
      }
    }
  }

  return false;
} as Rule.InlineRule['fn']);
