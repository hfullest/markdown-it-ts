// Process *this* and _that_
//

import { Token } from '../../basic/token';
import { Rule } from '../../interface';
import { StateInline } from '../../state/inline';

/** Insert each marker as a separate text token, and add it to delimiter list */
export const tokenize = function emphasis(state, silent) {
  let i,
    scanned,
    token,
    start = state.pos,
    marker = state.src.charCodeAt(start);

  if (silent) {
    return false;
  }

  if (marker !== 0x5f /* _ */ && marker !== 0x2a /* * */) {
    return false;
  }

  scanned = state.scanDelims(state.pos, marker === 0x2a);

  for (i = 0; i < scanned.length; i++) {
    token = state.push('text', '', 0);
    token.content = String.fromCharCode(marker);

    state.delimiters.push({
      // Char code of the starting marker (number).
      //
      marker: marker,

      // Total length of these series of delimiters.
      //
      length: scanned.length,

      // A position of the token this delimiter corresponds to.
      //
      token: state.tokens.length - 1,

      // If this delimiter is matched as a valid opener, `end` will be
      // equal to its position, otherwise it's `-1`.
      //
      end: -1,

      // Boolean flags that determine if this delimiter could open or close
      // an emphasis.
      //
      open: scanned.can_open,
      close: scanned.can_close,
    });
  }

  state.pos += scanned.length;

  return true;
} as Rule.InlineRule['fn'];

function _postProcess(state: StateInline, delimiters: StateInline['delimiters']) {
  let i,
    startDelim,
    endDelim,
    token: Token,
    ch,
    isStrong,
    max = delimiters.length;

  for (i = max - 1; i >= 0; i--) {
    startDelim = delimiters[i];

    if (startDelim.marker !== 0x5f /* _ */ && startDelim.marker !== 0x2a /* * */) {
      continue;
    }

    // Process only opening markers
    if (startDelim.end === -1) {
      continue;
    }

    endDelim = delimiters[startDelim.end];

    // If the previous delimiter has the same marker and is adjacent to this one,
    // merge those into one strong delimiter.
    //
    // `<em><em>whatever</em></em>` -> `<strong>whatever</strong>`
    //
    isStrong =
      i > 0 &&
      delimiters[i - 1].end === startDelim.end + 1 &&
      // check that first two markers match and adjacent
      delimiters[i - 1].marker === startDelim.marker &&
      delimiters[i - 1].token === startDelim.token - 1 &&
      // check that last two markers are adjacent (we can safely assume they match)
      delimiters[startDelim.end + 1].token === endDelim.token + 1;

    ch = String.fromCharCode(startDelim.marker);

    token = state.tokens[startDelim.token];
    token.type = isStrong ? 'strong_open' : 'em_open';
    token.tag = isStrong ? 'strong' : 'em';
    token.nesting = 1;
    token.markup = isStrong ? ch + ch : ch;
    token.content = '';

    token = state.tokens[endDelim.token];
    token.type = isStrong ? 'strong_close' : 'em_close';
    token.tag = isStrong ? 'strong' : 'em';
    token.nesting = -1;
    token.markup = isStrong ? ch + ch : ch;
    token.content = '';

    if (isStrong) {
      state.tokens[delimiters[i - 1].token].content = '';
      state.tokens[delimiters[startDelim.end + 1].token].content = '';
      i--;
    }
  }
}

/** Walk through delimiter list and replace text tokens with tags */
export const postProcess = function emphasis(state) {
  let curr,
    tokens_meta = state.tokens_meta,
    max = state.tokens_meta.length;

  _postProcess(state, state.delimiters);

  for (curr = 0; curr < max; curr++) {
    if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
      _postProcess(state, tokens_meta[curr].delimiters);
    }
  }
} as Rule.InlineRule2['fn'];
