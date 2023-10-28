import { Ruler } from '../rules/ruler';
import { StateBlock } from '../state/block';
import { EnvSandbox, Rule } from '../interface';
import table from '../rules/block/table';
import { MarkdownIt } from '../markdown-it';
import { Token } from '../basic/token';
import code from '../rules/block/code';
import fence from '../rules/block/fence';
import blockquote from '../rules/block/blockquote';
import hr from '../rules/block/hr';
import list from '../rules/block/list';
import reference from '../rules/block/reference';
import html_block from '../rules/block/html_block';
import heading from '../rules/block/heading';
import lheading from '../rules/block/lheading';
import paragraph from '../rules/block/paragraph';

export class ParserBlock {
  ruler = new Ruler<Rule.BlockRule>([
    { name: 'table', fn: table, enabled: true, alt: ['paragraph', 'reference'] },
    { name: 'code', fn: code, enabled: true },
    { name: 'fence', fn: fence, enabled: true, alt: ['paragraph', 'reference', 'blockquote', 'list'] },
    { name: 'blockquote', fn: blockquote, enabled: true, alt: ['paragraph', 'reference', 'blockquote', 'list'] },
    { name: 'hr', fn: hr, enabled: true, alt: ['paragraph', 'reference', 'blockquote', 'list'] },
    { name: 'list', fn: list, enabled: true, alt: ['paragraph', 'reference', 'blockquote'] },
    { name: 'reference', fn: reference, enabled: true },
    { name: 'html_block', fn: html_block, enabled: true, alt: ['paragraph', 'reference', 'blockquote'] },
    { name: 'heading', fn: heading, enabled: true, alt: ['paragraph', 'reference', 'blockquote'] },
    { name: 'lheading', fn: lheading, enabled: true },
    { name: 'paragraph', fn: paragraph, enabled: true },
  ]);

  State = StateBlock;

  /** Generate tokens for input range */
  tokenize(state: StateBlock, startLine: number, endLine: number) {
    let ok,
      i,
      prevLine,
      rules = this.ruler.getRules(''),
      len = rules.length,
      line = startLine,
      hasEmptyLines = false,
      maxNesting = state.md.options.maxNesting;

    while (line < endLine) {
      state.line = line = state.skipEmptyLines(line);
      if (line >= endLine) {
        break;
      }

      // Termination condition for nested calls.
      // Nested calls currently used for blockquotes & lists
      if (state.sCount[line] < state.blkIndent) {
        break;
      }

      // If nesting level exceeded - skip tail to the end. That's not ordinary
      // situation and we should not care about content.
      if (state.level >= maxNesting) {
        state.line = endLine;
        break;
      }

      // Try all possible rules.
      // On success, rule should:
      //
      // - update `state.line`
      // - update `state.tokens`
      // - return true
      prevLine = state.line;

      for (i = 0; i < len; i++) {
        ok = rules[i](state, line, endLine, false);
        if (ok) {
          if (prevLine >= state.line) {
            throw new Error("block rule didn't increment state.line");
          }
          break;
        }
      }

      // this can only happen if user disables paragraph rule
      if (!ok) throw new Error('none of the block rules matched');

      // set state.tight if we had an empty line before current tag
      // i.e. latest empty line should not count
      state.tight = !hasEmptyLines;

      // paragraph might "eat" one newline after it in nested lists
      if (state.isEmpty(state.line - 1)) {
        hasEmptyLines = true;
      }

      line = state.line;

      if (line < endLine && state.isEmpty(line)) {
        hasEmptyLines = true;
        line++;
        state.line = line;
      }
    }
  }

  parse(src: string, md: MarkdownIt, env: EnvSandbox, outTokens: Token[]) {
    if (!src) return;

    const state = new this.State(src, md, env, outTokens);

    this.tokenize(state, state.line, state.lineMax);
  }
}
