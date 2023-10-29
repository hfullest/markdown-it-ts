import { Token } from '../../basic/token';
import { Nesting, Rule } from '../../interface';
import { isSpace } from '../../utils/utils';

/** heading (#, ##, ...) */
export default ((state, startLine, _endLine, silent) => {
  let ch,
    level,
    tmp,
    token:Token,
    pos = state.bMarks[startLine] + state.tShift[startLine],
    max = state.eMarks[startLine];

  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  ch = state.src.charCodeAt(pos);

  if (ch !== 0x23 /* # */ || pos >= max) {
    return false;
  }

  // count heading level
  level = 1;
  ch = state.src.charCodeAt(++pos);
  while (ch === 0x23 /* # */ && pos < max && level <= 6) {
    level++;
    ch = state.src.charCodeAt(++pos);
  }

  if (level > 6 || (pos < max && !isSpace(ch))) {
    return false;
  }

  if (silent) {
    return true;
  }

  // Let's cut tails like '    ###  ' from the end of string

  max = state.skipSpacesBack(max, pos);
  tmp = state.skipCharsBack(max, 0x23, pos); // #
  if (tmp > pos && isSpace(state.src.charCodeAt(tmp - 1))) {
    max = tmp;
  }

  state.line = startLine + 1;

  token = state.push('heading_open', 'h' + String(level), Nesting.opening);
  token.markup = '########'.slice(0, level);
  token.map = [startLine, state.line];

  token = state.push('inline', '', 0);
  token.content = state.src.slice(pos, max).trim();
  token.map = [startLine, state.line];
  token.children = [];

  token = state.push('heading_close', 'h' + String(level),Nesting.closing);
  token.markup = '########'.slice(0, level);

  return true;
}) as Rule.BlockRule['fn'];
