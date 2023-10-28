import { EnvSandbox, Rule } from '../interface';
import { Ruler } from '../rules/ruler';
import { StateInline } from '../state/inline';
import { MarkdownIt } from '../markdown-it';
import { Token } from '../basic/token';
import text from '../rules/inline/text';
import linkify from '../rules/inline/linkify';
import newline from '../rules/inline/newline';
import escape from '../rules/inline/escape';
import backticks from '../rules/inline/backticks';
import * as strikethrough from '../rules/inline/strikethrough';
import * as emphasis from '../rules/inline/emphasis';
import link from '../rules/inline/link';
import image from '../rules/inline/image';
import autolink from '../rules/inline/autolink';
import html_inline from '../rules/inline/html_inline';
import entity from '../rules/inline/entity';
import balance_pairs from '../rules/inline/balance_pairs';
import fragments_join from '../rules/inline/fragments_join';

export class ParserInline {
  ruler = new Ruler<Rule.InlineRule>([
    { name: 'text', fn: text, enabled: true },
    { name: 'linkify', fn: linkify, enabled: true },
    { name: 'newline', fn: newline, enabled: true },
    { name: 'escape', fn: escape, enabled: true },
    { name: 'backticks', fn: backticks, enabled: true },
    { name: 'strikethrough', fn: strikethrough.tokenize, enabled: true },
    { name: 'emphasis', fn: emphasis.tokenize, enabled: true },
    { name: 'link', fn: link, enabled: true },
    { name: 'image', fn: image, enabled: true },
    { name: 'autolink', fn: autolink, enabled: true },
    { name: 'html_inline', fn: html_inline, enabled: true },
    { name: 'entity', fn: entity, enabled: true },
  ]);

  /**
   * `rule2` ruleset was created specifically for emphasis/strikethrough
   * post-processing and may be changed in the future.
   *
   * Don't use this for anything except pairs (plugins working with `balance_pairs`).
   */
  ruler2 = new Ruler<Rule.InlineRule2>([
    { name: 'balance_pairs', fn: balance_pairs, enabled: true },
    { name: 'strikethrough', fn: strikethrough.postProcess, enabled: true },
    { name: 'emphasis', fn: emphasis.postProcess, enabled: true },
    { name: 'fragments_join', fn: fragments_join, enabled: true },
  ]);

  State = StateInline;

  /**
   * Skip single token by running all rules in validation mode;
   * returns `true` if any rule reported success
   */
  skipToken(state: StateInline) {
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

  /** Generate tokens for input range */
  tokenize(state: StateInline) {
    let ok,
      i,
      prevPos,
      rules = this.ruler.getRules(''),
      len = rules.length,
      end = state.posMax,
      maxNesting = state.md.options.maxNesting;

    while (state.pos < end) {
      // Try all possible rules.
      // On success, rule should:
      //
      // - update `state.pos`
      // - update `state.tokens`
      // - return true
      prevPos = state.pos;

      if (state.level < maxNesting) {
        for (i = 0; i < len; i++) {
          ok = rules[i](state, false);
          if (ok) {
            if (prevPos >= state.pos) {
              throw new Error("inline rule didn't increment state.pos");
            }
            break;
          }
        }
      }

      if (ok) {
        if (state.pos >= end) {
          break;
        }
        continue;
      }

      state.pending += state.src[state.pos++];
    }

    if (state.pending) {
      state.pushPending();
    }
  }

  /**
   * ParserInline.parse(str, md, env, outTokens)
   *
   * Process input string and push inline tokens into `outTokens`
   **/
  parse(str: string, md: MarkdownIt, env: EnvSandbox, outTokens: Token[]) {
    const state = new this.State(str, md, env, outTokens);
    this.tokenize(state);
    const rules = this.ruler2.getRules('');
    rules.forEach((rule) => rule?.(state));
  }
}
