import { Rule } from '../../interface';
import { escapeHtml } from '../../utils/utils';

export default (function code_inline(tokens, idx, _options, _env, slf) {
  const token = tokens[idx];
  return `<code ${slf.renderAttrs(token)}>${escapeHtml(token.content)}</code>`;
} as Rule.RenderRule['fn']);
