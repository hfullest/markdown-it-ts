import { Rule } from '../interface';
import { Ruler } from '../rules/ruler';
import { StateInline } from '../state/inline';
import text from '../rules/inline/text';
export class ParserInline {
  ruler = new Ruler<Rule.InlineRule>([
    { name: 'text', fn: text, enabled: true },
    { name: 'linkify', fn: text, enabled: true },
  ]);

  ruler2 = new Ruler<Rule.InlineRule2>();

  State = StateInline;

  /**
   * Skip single token by running all rules in validation mode;
   * returns `true` if any rule reported success
   */
  skipToken(state) {
    let ok,
      i,
      pos = state.pos,
      rules = this.ruler.getRules(''),
      len = rules.length,
      maxNesting = state.md.options.maxNesting,
      cache = state.cache;

    if (typeof cache[pos] !== 'undefined') {
      state.pos = cache[pos];
      return;
    }

    if (state.level < maxNesting) {
      for (i = 0; i < len; i++) {
        // Increment state.level and decrement it later to limit recursion.
        // It's harmless to do here, because no tokens are created. But ideally,
        // we'd need a separate private state variable for this purpose.
        //
        state.level++;
        ok = rules[i](state, true);
        state.level--;

        if (ok) {
          if (pos >= state.pos) {
            throw new Error("inline rule didn't increment state.pos");
          }
          break;
        }
      }
    } else {
      // Too much nesting, just skip until the end of the paragraph.
      //
      // NOTE: this will cause links to behave incorrectly in the following case,
      //       when an amount of `[` is exactly equal to `maxNesting + 1`:
      //
      //       [[[[[[[[[[[[[[[[[[[[[foo]()
      //
      // TODO: remove this workaround when CM standard will allow nested links
      //       (we can replace it by preventing links from being parsed in
      //       validation mode)
      //
      state.pos = state.posMax;
    }

    if (!ok) {
      state.pos++;
    }
    cache[pos] = state.pos;
  }
}
