// ~~strike through~~

import { Token } from '../../basic/token';
import { Rule } from '../../interface';
import { StateInline } from '../../state/inline';

/** ~~strike through~~
 * Insert each marker as a separate text token, and add it to delimiter list
 */
export const tokenize: Rule.InlineRule['fn'] = function strikethrough(state, silent) {
  let i,
    scanned,
    token,
    len,
    ch,
    start = state.pos,
    marker = state.src.charCodeAt(start);

  if (silent) {
    return false;
  }

  if (marker !== 0x7e /* ~ */) {
    return false;
  }

  scanned = state.scanDelims(state.pos, true);
  len = scanned.length;
  ch = String.fromCharCode(marker);

  if (len < 2) {
    return false;
  }

  if (len % 2) {
    token = state.push('text', '', 0);
    token.content = ch;
    len--;
  }

  for (i = 0; i < len; i += 2) {
    token = state.push('text', '', 0);
    token.content = ch + ch;

    state.delimiters.push({
      marker: marker,
      length: 0, // disable "rule of 3" length checks meant for emphasis
      token: state.tokens.length - 1,
      end: -1,
      open: scanned.can_open,
      close: scanned.can_close,
    });
  }

  state.pos += scanned.length;

  return true;
};

function _postProcess(state: StateInline, delimiters: StateInline['delimiters']) {
  let i,
    j,
    startDelim: StateInline['delimiters'][number],
    endDelim: StateInline['delimiters'][number],
    token: Token,
    loneMarkers: StateInline['delimiters'][number]['marker'][] = [],
    max = delimiters.length;

  for (i = 0; i < max; i++) {
    startDelim = delimiters[i];

    if (startDelim.marker !== 0x7e /* ~ */) {
      continue;
    }

    if (startDelim.end === -1) {
      continue;
    }

    endDelim = delimiters[startDelim.end];

    token = state.tokens[startDelim.token];
    token.type = 's_open';
    token.tag = 's';
    token.nesting = 1;
    token.markup = '~~';
    token.content = '';

    token = state.tokens[endDelim.token];
    token.type = 's_close';
    token.tag = 's';
    token.nesting = -1;
    token.markup = '~~';
    token.content = '';

    if (state.tokens[endDelim.token - 1].type === 'text' && state.tokens[endDelim.token - 1].content === '~') {
      loneMarkers.push(endDelim.token - 1);
    }
  }

  // If a marker sequence has an odd number of characters, it's splitted
  // like this: `~~~~~` -> `~` + `~~` + `~~`, leaving one marker at the
  // start of the sequence.
  //
  // So, we have to move all those markers after subsequent s_close tags.
  //
  while (loneMarkers.length) {
    i = loneMarkers.pop();
    j = i + 1;

    while (j < state.tokens.length && state.tokens[j].type === 's_close') {
      j++;
    }

    j--;

    if (i !== j) {
      token = state.tokens[j];
      state.tokens[j] = state.tokens[i];
      state.tokens[i] = token;
    }
  }
}

/** Walk through delimiter list and replace text tokens with tags */
export const postProcess: Rule.InlineRule['fn'] = function strikethrough(state) {
  let curr,
    tokens_meta = state.tokens_meta,
    max = state.tokens_meta.length;

  _postProcess(state, state.delimiters);

  for (curr = 0; curr < max; curr++) {
    if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
      _postProcess(state, tokens_meta[curr].delimiters);
    }
  }
  return true; //TODO: 待确认正确
};
