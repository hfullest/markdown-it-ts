import { ParserBlock } from "./parser/block";
import { ParserCore } from "./parser/core";
import { ParserInline } from "./parser/inline";

export type PresetNameType = "default" | "commonmark" | "zero";

export type Highlighter = (str: string, lang: string) => string;

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
  core: ParserCore;
  block: ParserBlock;
  inline: ParserInline;
}

export interface Config {
  options?: Options;

  components?: Components;
}
