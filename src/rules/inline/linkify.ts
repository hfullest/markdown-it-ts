// Process links like https://example.org/

import { Token } from '../../basic/token';
import { Rule } from '../../interface';

// RFC3986: scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
const SCHEME_RE = /(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;

/** Process links like https://example.org/ */
export default (function linkify(state, silent) {
  let pos, max, match, proto, link, url, fullUrl, token: Token;

  if (!state.md.options.linkify) return false;
  if (state.linkLevel > 0) return false;

  pos = state.pos;
  max = state.posMax;

  if (pos + 3 > max) return false;
  if (state.src.charCodeAt(pos) !== 0x3a /* : */) return false;
  if (state.src.charCodeAt(pos + 1) !== 0x2f /* / */) return false;
  if (state.src.charCodeAt(pos + 2) !== 0x2f /* / */) return false;

  match = state.pending.match(SCHEME_RE);
  if (!match) return false;

  proto = match[1];

  /**@ts-ignore matchAtStart 在最新的API有，但是声明文件没有更新，暂时先忽略 */
  link = state.md.linkify.matchAtStart(state.src.slice(pos - proto.length));
  if (!link) return false;

  url = link.url;

  // invalid link, but still detected by linkify somehow;
  // need to check to prevent infinite loop below
  if (url.length <= proto.length) return false;

  // disallow '*' at the end of the link (conflicts with emphasis)
  url = url.replace(/\*+$/, '');

  fullUrl = state.md.normalizeLink(url);
  if (!state.md.validateLink(fullUrl)) return false;

  if (!silent) {
    state.pending = state.pending.slice(0, -proto.length);

    token = state.push('link_open', 'a', 1);
    token.attrs = [['href', fullUrl]];
    token.markup = 'linkify';
    token.info = 'auto';

    token = state.push('text', '', 0);
    token.content = state.md.normalizeLinkText(url);

    token = state.push('link_close', 'a', -1);
    token.markup = 'linkify';
    token.info = 'auto';
  }

  state.pos += url.length - proto.length;
  return true;
} as Rule.InlineRule['fn']);
