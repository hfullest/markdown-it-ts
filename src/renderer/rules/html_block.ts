import { Rule } from '../../interface';

export default (function (tokens, idx /*, options, env */) {
  return tokens[idx].content;
} as Rule.RenderRule['fn']);
