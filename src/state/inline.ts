import { Token } from '../basic/token';
import { EnvSandbox, Nesting } from '../interface';
import { MarkdownIt } from '../markdown-it';
import { isMdAsciiPunct, isPunctChar, isWhiteSpace } from '../utils/utils';

export class StateInline {
  pos = 0;
  posMax = this.src.length;
  level = 0;
  pending = '';
  pendingLevel = 0;

  /**
   * Stores { start: end } pairs. Useful for backtrack
   * optimization of pairs parse (emphasis, strikes).
   */
  cache = {};

  /** List of emphasis-like delimiters for current tag */
  delimiters: {
    /** Char code of the starting marker (number). */
    marker: number;
    /** Total length of these series of delimiters. */
    length: number;
    /** A position of the token this delimiter corresponds to. */
    token: number;
    /**  If this delimiter is matched as a valid opener, `end` will be equal to its position, otherwise it's `-1`. */
    end: number;
    /** Boolean flags that determine if this delimiter could open an emphasis. */
    open: boolean;
    /** Boolean flags that determine if this delimiter could close an emphasis. */
    close: boolean;
  }[] = [];

  /**  Stack of delimiter lists for upper level tags */
  private _prev_delimiters: StateInline['delimiters'][] = [];

  /**  backtick length => last seen position */
  backticks = {};
  backticksScanned = false;

  /**
   * Counter used to disable inline linkify-it execution
   * inside `<a>` and markdown links
   */
  linkLevel = 0;

  tokens_meta: { delimiters: StateInline['delimiters'] }[] = Array(this.tokens.length);
  constructor(public src: string, public md: MarkdownIt, public env: EnvSandbox, public tokens: Token[]) {}

  /** Flush pending text */
  pushPending() {
    const token = new Token('text', '', 0);
    token.content = this.pending;
    token.level = this.pendingLevel;
    this.tokens.push(token);
    this.pending = '';
    return token;
  }

  /**
   * Push new token to "stream".
   * If pending text exists - flush it as text token
   */
  push(type: Token.Type, tag: string, nesting: Nesting) {
    if (this.pending) {
      this.pushPending();
    }

    let token = new Token(type, tag, nesting);
    let token_meta: any = null;

    if (nesting === Nesting.closing) {
      // closing tag
      this.level--;
      this.delimiters = this._prev_delimiters.pop() ?? [];
    }

    token.level = this.level;

    if (nesting === Nesting.opening) {
      // opening tag
      this.level++;
      this._prev_delimiters.push(this.delimiters);
      this.delimiters = [];
      token_meta = { delimiters: this.delimiters };
    }

    this.pendingLevel = this.level;
    this.tokens.push(token);
    this.tokens_meta.push(token_meta);
    return token;
  }

  /**
   * Scan a sequence of emphasis-like markers, and determine whether
   * it can start an emphasis sequence or end an emphasis sequence.
   *
   *  - start - position to scan from (it should point at a valid marker);
   *  - canSplitWord - determine if these markers can be found inside a word
   *
   */
  scanDelims(start: number, canSplitWord: boolean) {
    let pos = start,
      lastChar,
      nextChar,
      count,
      can_open,
      can_close,
      isLastWhiteSpace,
      isLastPunctChar,
      isNextWhiteSpace,
      isNextPunctChar,
      left_flanking = true,
      right_flanking = true,
      max = this.posMax,
      marker = this.src.charCodeAt(start);

    // treat beginning of the line as a whitespace
    lastChar = start > 0 ? this.src.charCodeAt(start - 1) : 0x20;

    while (pos < max && this.src.charCodeAt(pos) === marker) {
      pos++;
    }

    count = pos - start;

    // treat end of the line as a whitespace
    nextChar = pos < max ? this.src.charCodeAt(pos) : 0x20;

    isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
    isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));

    isLastWhiteSpace = isWhiteSpace(lastChar);
    isNextWhiteSpace = isWhiteSpace(nextChar);

    if (isNextWhiteSpace) {
      left_flanking = false;
    } else if (isNextPunctChar) {
      if (!(isLastWhiteSpace || isLastPunctChar)) {
        left_flanking = false;
      }
    }

    if (isLastWhiteSpace) {
      right_flanking = false;
    } else if (isLastPunctChar) {
      if (!(isNextWhiteSpace || isNextPunctChar)) {
        right_flanking = false;
      }
    }

    if (!canSplitWord) {
      can_open = left_flanking && (!right_flanking || isLastPunctChar);
      can_close = right_flanking && (!left_flanking || isNextPunctChar);
    } else {
      can_open = left_flanking;
      can_close = right_flanking;
    }

    return {
      can_open: can_open,
      can_close: can_close,
      length: count,
    };
  }
}
