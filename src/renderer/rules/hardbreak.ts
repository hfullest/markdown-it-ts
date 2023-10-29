import { Rule } from '../../interface';

export default (function (_tokens, _idx, options /*, env */) {
  return options.xhtmlOut ? '<br />\n' : '<br>\n';
} as Rule.RenderRule['fn']);
