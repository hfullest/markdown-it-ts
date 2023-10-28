import { Token } from '../basic/token';
import { EnvSandbox, Nesting } from '../interface';
import { MarkdownIt } from '../markdown-it';
import { isSpace } from '../utils/utils';

export class StateBlock {
  /** line begin offsets for fast jumps */
  bMarks: number[] = [];
  /** line end offsets for fast jumps */
  eMarks: number[] = [];
  /** offsets of the first non-space characters (tabs not expanded) */
  tShift: number[] = [];
  /** indents for each line (tabs expanded) */
  sCount: number[] = [];

  /**
   * An amount of virtual spaces (tabs expanded) between beginning
   * of each line (bMarks) and real beginning of that line.
   *
   * It exists only as a hack because blockquotes override bMarks
   * losing information in the process.
   *
   * It's used only when expanding tabs, you can think about it as
   * an initial tab length, e.g. bsCount=21 applied to string `\t123`
   * means first tab should be expanded to 4-21%4 === 3 spaces.
   *
   */
  bsCount: number[] = [];
  /** required block content indent (for example, if we are inside a list, it would be positioned after list marker) */
  blkIndent = 0;
  /** line index in src */
  line = 0;
  /** lines count */
  lineMax = 0;
  /** loose/tight mode for lists */
  tight = false;
  /** indent of the current dd block (-1 if there isn't any) */
  ddIndent = -1;
  /** indent of the current list block (-1 if there isn't any) */
  listIndent = -1;
  /**
   * can be 'blockquote', 'list', 'root', 'paragraph' or 'reference'
   * used in lists to determine if they interrupt a paragraph
   *  */
  parentType: 'blockquote' | 'list' | 'root' | 'paragraph' | 'reference' | 'table' = 'root';

  level = 0;

  result = '';

  readonly Token = Token;
  constructor(public src: string, public md: MarkdownIt, public env: EnvSandbox, public tokens: Token[]) {
    this.genMarkers();
  }

 private genMarkers() {
    let ch, s, start, pos, len, indent, offset, indent_found;
    // Create caches
    // Generate markers.
    s = this.src;
    indent_found = false;

    for (start = pos = indent = offset = 0, len = s.length; pos < len; pos++) {
      ch = s.charCodeAt(pos);

      if (!indent_found) {
        if (isSpace(ch)) {
          indent++;

          if (ch === 0x09) {
            offset += 4 - (offset % 4);
          } else {
            offset++;
          }
          continue;
        } else {
          indent_found = true;
        }
      }

      if (ch === 0x0a || pos === len - 1) {
        if (ch !== 0x0a) {
          pos++;
        }
        this.bMarks.push(start);
        this.eMarks.push(pos);
        this.tShift.push(indent);
        this.sCount.push(offset);
        this.bsCount.push(0);

        indent_found = false;
        indent = 0;
        offset = 0;
        start = pos + 1;
      }
    }

    // Push fake entry to simplify cache bounds checks
    this.bMarks.push(s.length);
    this.eMarks.push(s.length);
    this.tShift.push(0);
    this.sCount.push(0);
    this.bsCount.push(0);

    this.lineMax = this.bMarks.length - 1; // don't count last fake line
  }

  /** Push new token to "stream". */
  push(type: Token.Type, tag: string, nesting: Nesting) {
    const token = new Token(type, tag, nesting);
    token.block = true;

    if (nesting === Nesting.closing) this.level--; // closing tag
    token.level = this.level;
    if (nesting === Nesting.opening) this.level++; // opening tag

    this.tokens.push(token);
    return token;
  }

  isEmpty(line: number) {
    return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
  }

  skipEmptyLines(from: number) {
    for (let max = this.lineMax; from < max; from++) {
      if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) {
        break;
      }
    }
    return from;
  }

  /** Skip spaces from given position. */
  skipSpaces(pos: number) {
    for (let max = this.src.length; pos < max; pos++) {
      const ch = this.src.charCodeAt(pos);
      if (!isSpace(ch)) {
        break;
      }
    }
    return pos;
  }

  /** Skip spaces from given position in reverse. */
  skipSpacesBack(pos: number, min: number) {
    if (pos <= min) {
      return pos;
    }

    while (pos > min) {
      if (!isSpace(this.src.charCodeAt(--pos))) {
        return pos + 1;
      }
    }
    return pos;
  }

  /** Skip char codes from given position */
  skipChars(pos: number, code: number) {
    for (let max = this.src.length; pos < max; pos++) {
      if (this.src.charCodeAt(pos) !== code) {
        break;
      }
    }
    return pos;
  }

  /** Skip char codes reverse from given position - 1 */
  skipCharsBack(pos: number, code: number, min: number) {
    if (pos <= min) {
      return pos;
    }

    while (pos > min) {
      if (code !== this.src.charCodeAt(--pos)) {
        return pos + 1;
      }
    }
    return pos;
  }

  /** cut lines range from source. */
  getLines(begin: number, end: number, indent: number, keepLastLF: boolean):string {
    let i,
      lineIndent,
      ch,
      first,
      last,
      queue,
      lineStart,
      line = begin;

    if (begin >= end) {
      return '';
    }

    queue = new Array(end - begin);

    for (i = 0; line < end; line++, i++) {
      lineIndent = 0;
      lineStart = first = this.bMarks[line];

      if (line + 1 < end || keepLastLF) {
        // No need for bounds check because we have fake entry on tail.
        last = this.eMarks[line] + 1;
      } else {
        last = this.eMarks[line];
      }

      while (first < last && lineIndent < indent) {
        ch = this.src.charCodeAt(first);

        if (isSpace(ch)) {
          if (ch === 0x09) {
            lineIndent += 4 - ((lineIndent + this.bsCount[line]) % 4);
          } else {
            lineIndent++;
          }
        } else if (first - lineStart < this.tShift[line]) {
          // patched tShift masked characters to look like spaces (blockquotes, list markers)
          lineIndent++;
        } else {
          break;
        }

        first++;
      }

      if (lineIndent > indent) {
        // partially expanding tabs in code blocks, e.g '\t\tfoobar'
        // with indent=2 becomes '  \tfoobar'
        queue[i] = new Array(lineIndent - indent + 1).join(' ') + this.src.slice(first, last);
      } else {
        queue[i] = this.src.slice(first, last);
      }
    }

    return queue.join('');
  }
}
