import { Rule } from '../../interface';
import { escapeHtml } from '../../utils/utils';

export default (function (tokens, idx /*, options, env */) {
  return escapeHtml(tokens[idx].content);
} as Rule.RenderRule['fn']);
