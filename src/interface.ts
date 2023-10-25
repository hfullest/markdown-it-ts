import { MarkdownIt } from "./markdown-it";

export type PresetNameType = "default" | "commonmark" | "zero";

export type Highlighter = (str: string, lang: string) => string;

export type CoreRule<R = never> =
  | "normalize"
  | "block"
  | "inline"
  | "text_join"
  | R;

export type BlockRule<R = never> =
  | "blockquote"
  | "code"
  | "fence"
  | "heading"
  | "hr"
  | "html_block"
  | "lheading"
  | "list"
  | "reference"
  | "paragraph"
  | R;

export type InlineRule<R = never> =
  | "autolink"
  | "backticks"
  | "emphasis"
  | "entity"
  | "escape"
  | "html_inline"
  | "image"
  | "link"
  | "newline"
  | "text"
  | R;

export type InlineRule2<R = never> =
  | "balance_pairs"
  | "emphasis"
  | "fragments_join"
  | R;

export type Rule<R = never> = CoreRule | BlockRule | InlineRule | R;

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

  // Highlighter function. Should return escaped HTML,
  // or '' if the source string is not changed and should be escaped externaly.
  // If result starts with <pre... internal wrapper is skipped.
  //
  // function (/*str, lang*/) { return ''; }
  //
  highlight: Highlighter;

  /** @inner */
  maxNesting: number; // Internal protection, recursion limit
}

export interface Components {
  core: { rules: CoreRule[] };
  block: { rules: BlockRule[] };
  inline: { rules: InlineRule[]; rules2?: InlineRule2 };
}

export interface Config {
  options?: Options;

  components?: Components;
}

export interface Plugin {
  (md: MarkdownIt, params: any): void;
}

export interface EnvSandbox {}

