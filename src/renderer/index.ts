import { Token } from '../basic/token';
import { Options, EnvSandbox, RuleType, Nesting, RuleCallback } from '../interface';
import { escapeHtml } from '../utils/utils';

export class Renderer {
  /**
   *
   * Contains render rules for tokens. Can be updated and extended.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')();
   *
   * md.renderer.rules.strong_open  = function () { return '<b>'; };
   * md.renderer.rules.strong_close = function () { return '</b>'; };
   *
   * var result = md.renderInline(...);
   * ```
   *
   * Each rule is called as independent static function with fixed signature:
   *
   * ```javascript
   * function my_token_render(tokens, idx, options, env, renderer) {
   *   // ...
   *   return renderedHTML;
   * }
   * ```
   */
  rules: Partial<Record<RuleType, RuleCallback>> = {};

  /**
   * Renderer.renderAttrs(token) -> String
   *
   * Render token attributes to string.
   **/
  renderAttrs(token: Token) {
    if (!token.attrs.length) return '';
    const attrs = token.attrs.map(([name, value]) => `${escapeHtml(name)}="${escapeHtml(value)}"`);
    return attrs.join(' ');
  }

  /**
   * Renderer.renderToken(tokens, idx, options) -> String
   * - tokens (Array): list of tokens
   * - idx (Numbed): token index to render
   * - options (Object): params of parser instance
   *
   * Default token renderer. Can be overriden by custom function
   * in [[Renderer#rules]].
   **/
  renderToken(tokens: Token[], idx: number, options: Options) {
    const token = tokens[idx];
    if (token.hidden) return '';
    let result = '';
    let needLf = false;
    let nextToken: Token | null = null;
    // Insert a newline between hidden paragraph and subsequent opening
    // block-level tag.
    //
    // For example, here we should insert a newline before blockquote:
    //  - a
    //    >
    //
    if (token.block && token.nesting !== Nesting.closing && idx && tokens[idx - 1].hidden) {
      result += `\n`;
    }
    // Add token name, e.g. `<img`
    result += `${token.nesting === Nesting.closing ? '</' : '<'}${token.tag}`;
    // Encode attributes, e.g. `<img src="foo"`
    result += this.renderAttrs(token);
    // Add a slash for self-closing tags, e.g. `<img src="foo" /`
    if (token.nesting === Nesting.self_closing && options.xhtmlOut) {
      result += ` /`;
    }
    result += `>`;
    // Check if we need to add a newline after this tag
    if (token.block) {
      needLf = true;

      if (token.nesting === Nesting.opening) {
        if (idx < tokens.length - 1) {
          nextToken = tokens[idx + 1];

          if (nextToken.type === 'inline' || nextToken.hidden) {
            // Block-level tag containing an inline tag.
            needLf = false;
          } else if (nextToken.nesting === Nesting.closing && nextToken.tag === token.tag) {
            // Opening tag + closing tag of the same type. E.g. `<li></li>`.
            needLf = false;
          }
        }
      }
    }
    result += needLf ? `\n` : '';
    return result;
  }

  /**
   * Renderer.renderInline(tokens, options, env) -> String
   * - tokens (Array): list on block tokens to render
   * - options (Object): params of parser instance
   * - env (Object): additional data from parsed input (references, for example)
   *
   * The same as [[Renderer.render]], but for single token of `inline` type.
   **/
  renderInline(tokens: Token[], options: Options, env: EnvSandbox) {
    let result = '';
    const rules = this.rules;
    tokens.forEach((_, idx) => {
      const type = tokens[idx].type;
      if (typeof rules[type] !== 'undefined') result += rules[type]?.(tokens, idx, options, env, this) ?? '';
      else result += this.renderToken(tokens, idx, options);
    });
    return result;
  }

  /** internal
   * Renderer.renderInlineAsText(tokens, options, env) -> String
   * - tokens (Array): list on block tokens to render
   * - options (Object): params of parser instance
   * - env (Object): additional data from parsed input (references, for example)
   *
   * Special kludge for image `alt` attributes to conform CommonMark spec.
   * Don't try to use it! Spec requires to show `alt` content with stripped markup,
   * instead of simple escaping.
   **/
  #renderInlineAsText(tokens: Token[], options: Options, env: EnvSandbox) {
    let result = '';
    tokens?.forEach((token) => {
      switch (token.type) {
        case 'text':
          result += token.content;
          break;
        case 'image':
          result += this.#renderInlineAsText(token.children ?? [], options, env);
          break;
        case 'softbreak':
          result += `\n`;
      }
    });
    return result;
  }

  /**
   * Renderer.render(tokens, options, env) -> String
   * - tokens (Array): list on block tokens to render
   * - options (Object): params of parser instance
   * - env (Object): additional data from parsed input (references, for example)
   *
   * Takes token stream and generates HTML. Probably, you will never need to call
   * this method directly.
   **/
  render(tokens: Token[], options: Options, env: EnvSandbox) {
    let result = '';
    const rules = this.rules;
    tokens?.forEach((token, idx) => {
      const type = token.type;
      if (type === 'inline') {
        result += this.renderInline(token.children ?? [], options, env);
      } else if (typeof rules[type] !== 'undefined') {
        result += rules[type]?.(tokens, idx, options, env, this) ?? '';
      } else {
        result += this.renderToken(tokens, idx, options) ?? '';
      }
    });
    return result;
  }
}
