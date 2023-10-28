// Process autolinks '<protocol:...>'

import { Token } from '../../basic/token';
import { Rule } from '../../interface';

/*eslint max-len:0*/
const EMAIL_RE =
  /^([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/;
const AUTOLINK_RE = /^([a-zA-Z][a-zA-Z0-9+.\-]{1,31}):([^<>\x00-\x20]*)$/;

/** Process autolinks '<protocol:...>' */
export default (function autolink(state, silent) {
  let url,
    fullUrl,
    token:Token,
    ch,
    start,
    max,
    pos = state.pos;

  if (state.src.charCodeAt(pos) !== 0x3c /* < */) {
    return false;
  }

  start = state.pos;
  max = state.posMax;

  for (;;) {
    if (++pos >= max) return false;

    ch = state.src.charCodeAt(pos);

    if (ch === 0x3c /* < */) return false;
    if (ch === 0x3e /* > */) break;
  }

  url = state.src.slice(start + 1, pos);

  if (AUTOLINK_RE.test(url)) {
    fullUrl = state.md.normalizeLink(url);
    if (!state.md.validateLink(fullUrl)) {
      return false;
    }

    if (!silent) {
      token = state.push('link_open', 'a', 1);
      token.attrs = [['href', fullUrl]];
      token.markup = 'autolink';
      token.info = 'auto';

      token = state.push('text', '', 0);
      token.content = state.md.normalizeLinkText(url);

      token = state.push('link_close', 'a', -1);
      token.markup = 'autolink';
      token.info = 'auto';
    }

    state.pos += url.length + 2;
    return true;
  }

  if (EMAIL_RE.test(url)) {
    fullUrl = state.md.normalizeLink('mailto:' + url);
    if (!state.md.validateLink(fullUrl)) {
      return false;
    }

    if (!silent) {
      token = state.push('link_open', 'a', 1);
      token.attrs = [['href', fullUrl]];
      token.markup = 'autolink';
      token.info = 'auto';

      token = state.push('text', '', 0);
      token.content = state.md.normalizeLinkText(url);

      token = state.push('link_close', 'a', -1);
      token.markup = 'autolink';
      token.info = 'auto';
    }

    state.pos += url.length + 2;
    return true;
  }

  return false;
} as Rule.InlineRule['fn']);
