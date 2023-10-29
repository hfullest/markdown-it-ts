import { Rule } from '../../interface';

export default (function (tokens, idx, options, env, slf) {
  const token = tokens[idx];

  // "alt" attr MUST be set, even if empty. Because it's mandatory and
  // should be placed on proper position for tests.
  //
  // Replace content with actual value

  token.attrs[token.attrIndex('alt')][1] = slf.renderInlineAsText(token.children ?? [], options, env);

  return slf.renderToken(tokens, idx, options);
} as Rule.RenderRule['fn']);
