import { Rule } from '../../interface';

export default (function (_tokens, _idx, options /*, env */) {
  return options.breaks ? (options.xhtmlOut ? '<br />\n' : '<br>\n') : '\n';
} as Rule.RenderRule['fn']);
