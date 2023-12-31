import { Token } from './basic/token';
import { MarkdownIt } from './markdown-it';
import { Renderer } from './renderer';
import { StateBlock } from './state/block';
import { StateCore } from './state/core';
import { StateInline } from './state/inline';

export type PresetNameType = 'default' | 'commonmark' | 'zero';

export type Highlighter = (
  str: string,
  lang: string,
  attrs?: string /** 应该没有该属性，但是代码有地方有三个参数，做类型兼容 */
) => string;

export enum Nesting {
  opening = 1,
  self_closing = 0,
  closing = -1,
}

export namespace Rule {
  export type CoreRuleType<T = never> = CoreRule['name'] | T;

  export type BlockRuleType<T = never> = BlockRule['name'] | T;

  export type InlineRuleType<T = never> = InlineRule['name'] | T;

  export type InlineRule2Type<T = never> = InlineRule2['name'] | T;

  export type RuleType<T = never> = CoreRuleType | BlockRuleType | InlineRuleType | T;

  export interface BasicRule<F extends Function = Function> {
    name: string;
    enabled: boolean;
    fn: F;
    alt?: string[];
  }

  export interface RenderRule {
    name:
      | 'code_inline'
      | 'code_block'
      | 'fence'
      | 'image'
      | 'hardbreak'
      | 'softbreak'
      | 'text'
      | 'html_block'
      | 'html_inline';
    fn: <This extends typeof Renderer = typeof Renderer>(
      tokens: Token[],
      idx: number,
      options: Options,
      env: EnvSandbox,
      slf: InstanceType<This>
    ) => string;
  }

  export interface BlockRule extends BasicRule {
    name:
      | 'table'
      | 'code'
      | 'fence'
      | 'blockquote'
      | 'hr'
      | 'list'
      | 'reference'
      | 'html_block'
      | 'heading'
      | 'lheading'
      | 'paragraph';
    fn: (state: StateBlock, startLine: number, endLine: number, silent: boolean) => boolean;
  }

  export interface CoreRule extends BasicRule {
    name: 'normalize' | 'block' | 'inline' | 'linkify' | 'replacements' | 'smartquotes' | 'text_join';
    fn: (state: StateCore) => void;
  }

  export interface InlineRule extends BasicRule {
    name:
      | 'text'
      | 'linkify'
      | 'newline'
      | 'escape'
      | 'backticks'
      | 'strikethrough'
      | 'emphasis'
      | 'link'
      | 'image'
      | 'autolink'
      | 'html_inline'
      | 'entity';
    fn: (state: StateInline, silent: boolean) => boolean;
  }

  export interface InlineRule2 extends BasicRule {
    name: 'balance_pairs' | 'strikethrough' | 'emphasis' | 'fragments_join';
    fn: (state: StateInline, silent: boolean) => void;
  }
}

export interface Options {
  html: boolean; // Enable HTML tags in source
  xhtmlOut: boolean; // Use '/' to close single tags (<br />)
  breaks: boolean; // Convert '\n' in paragraphs into <br>
  langPrefix: string; // CSS language prefix for fenced blocks
  linkify: boolean; // autoconvert URL-like texts to links

  // Enable some language-neutral replacements + quotes beautification
  typographer: boolean;

  // Double + single quotes replacement pairs, when typographer enabled,
  // and smartquotes on. Could be either a String or an Array.
  //
  // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
  // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
  quotes: string;

  /**
   * Highlighter function. Should return escaped HTML,
   * or '' if the source string is not changed and should be escaped externaly.
   * If result starts with <pre... internal wrapper is skipped.
   * function (str, lang) { return ''; }
   */
  highlight: Highlighter | null;

  /** @inner */
  maxNesting: number; // Internal protection, recursion limit
}

export interface Components {
  core: { rules: Rule.CoreRuleType[] };
  block: { rules: Rule.BlockRuleType[] };
  inline: { rules: Rule.InlineRuleType[]; rules2?: Rule.InlineRule2Type[] };
}

export interface Config {
  options?: Options;

  components?: Components;
}

export interface Plugin {
  (md: MarkdownIt, params: any): void;
}

export interface EnvSandbox {
  references?: Record<string, { title: string; href: string }>;
}
