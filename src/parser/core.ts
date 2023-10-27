import { Rule } from '../interface';
import { Ruler } from '../rules/ruler';
import { StateCore } from '../state/core';
import normalize from '../rules/core/normalize';

export class ParserCore {
  ruler = new Ruler<Rule.CoreRule>([
    { name: 'normalize', fn: normalize, enabled: true },
    { name: 'block', fn: normalize, enabled: true },
  ]);

  ruler2 = new Ruler();

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
