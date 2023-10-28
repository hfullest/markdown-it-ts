import { Rule } from '../interface';
import { Ruler } from '../rules/ruler';
import { StateCore } from '../state/core';
import normalize from '../rules/core/normalize';
import block from '../rules/core/block';
import inline from '../rules/core/inline';
import linkify from '../rules/core/linkify';
import replacements from '../rules/core/replacements';
import smartquotes from '../rules/core/smartquotes';
import text_join from '../rules/core/text_join';

export class ParserCore {
  ruler = new Ruler<Rule.CoreRule>([
    { name: 'normalize', fn: normalize, enabled: true },
    { name: 'block', fn: block, enabled: true },
    { name: 'inline', fn: inline, enabled: true },
    { name: 'linkify', fn: linkify, enabled: true },
    { name: 'replacements', fn: replacements, enabled: true },
    { name: 'smartquotes', fn: smartquotes, enabled: true },
    { name: 'text_join', fn: text_join, enabled: true },
  ]);

  State = StateCore;

  /**
   * Core.process(state)
   *
   * Executes core chain rules.
   **/
  process(state: StateCore) {
    const rules = this.ruler.getRules('');
    rules.forEach((rule) => rule(state));
  }
}
