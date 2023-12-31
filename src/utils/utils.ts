import entities from '../common/entities';
import UNICODE_PUNCT_RE from 'uc.micro/categories/P/regex';

export function isString(obj: any) {
  return typeof obj === 'string';
}

export function has(object: object, key: string) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export const assign = Object.assign;

// Remove element from array and put another array at those position.
// Useful for some operations with tokens
export function arrayReplaceAt(src: any[], pos: number, newElements: any) {
  return [].concat(src.slice(0, pos) as any, newElements, src.slice(pos + 1) as any);
}

////////////////////////////////////////////////////////////////////////////////

export function isValidEntityCode(c: number) {
  /*eslint no-bitwise:0*/
  // broken sequence
  if (c >= 0xd800 && c <= 0xdfff) {
    return false;
  }
  // never used
  if (c >= 0xfdd0 && c <= 0xfdef) {
    return false;
  }
  if ((c & 0xffff) === 0xffff || (c & 0xffff) === 0xfffe) {
    return false;
  }
  // control codes
  if (c >= 0x00 && c <= 0x08) {
    return false;
  }
  if (c === 0x0b) {
    return false;
  }
  if (c >= 0x0e && c <= 0x1f) {
    return false;
  }
  if (c >= 0x7f && c <= 0x9f) {
    return false;
  }
  // out of range
  if (c > 0x10ffff) {
    return false;
  }
  return true;
}

export function fromCodePoint(c: number) {
  /*eslint no-bitwise:0*/
  if (c > 0xffff) {
    c -= 0x10000;
    const surrogate1 = 0xd800 + (c >> 10),
      surrogate2 = 0xdc00 + (c & 0x3ff);

    return String.fromCharCode(surrogate1, surrogate2);
  }
  return String.fromCharCode(c);
}

const UNESCAPE_MD_RE = /\\([!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~])/g;
const ENTITY_RE = /&([a-z#][a-z0-9]{1,31});/gi;
const UNESCAPE_ALL_RE = new RegExp(UNESCAPE_MD_RE.source + '|' + ENTITY_RE.source, 'gi');

const DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;

function replaceEntityPattern(match: any, name: any) {
  let code;

  if (has(entities, name)) {
    return entities[name];
  }

  if (name.charCodeAt(0) === 0x23 /* # */ && DIGITAL_ENTITY_TEST_RE.test(name)) {
    code = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);

    if (isValidEntityCode(code)) {
      return fromCodePoint(code);
    }
  }

  return match;
}

/*function replaceEntities(str) {
  if (str.indexOf('&') < 0) { return str; }

  return str.replace(ENTITY_RE, replaceEntityPattern);
}*/

export function unescapeMd(str) {
  if (str.indexOf('\\') < 0) {
    return str;
  }
  return str.replace(UNESCAPE_MD_RE, '$1');
}

export function unescapeAll(str) {
  if (str.indexOf('\\') < 0 && str.indexOf('&') < 0) {
    return str;
  }

  return str.replace(UNESCAPE_ALL_RE, function (match, escaped, entity) {
    if (escaped) {
      return escaped;
    }
    return replaceEntityPattern(match, entity);
  });
}

////////////////////////////////////////////////////////////////////////////////

const HTML_ESCAPE_TEST_RE = /[&<>"]/;
const HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
const HTML_REPLACEMENTS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

export function replaceUnsafeChar(ch) {
  return HTML_REPLACEMENTS[ch];
}

export function escapeHtml(str) {
  if (HTML_ESCAPE_TEST_RE.test(str)) {
    return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
  }
  return str;
}

////////////////////////////////////////////////////////////////////////////////

const REGEXP_ESCAPE_RE = /[.?*+^$[\]\\(){}|-]/g;

export function escapeRE(str) {
  return str.replace(REGEXP_ESCAPE_RE, '\\$&');
}

////////////////////////////////////////////////////////////////////////////////

export function isSpace(code) {
  switch (code) {
    case 0x09:
    case 0x20:
      return true;
  }
  return false;
}

// Zs (unicode class) || [\t\f\v\r\n]
export function isWhiteSpace(code) {
  if (code >= 0x2000 && code <= 0x200a) {
    return true;
  }
  switch (code) {
    case 0x09: // \t
    case 0x0a: // \n
    case 0x0b: // \v
    case 0x0c: // \f
    case 0x0d: // \r
    case 0x20:
    case 0xa0:
    case 0x1680:
    case 0x202f:
    case 0x205f:
    case 0x3000:
      return true;
  }
  return false;
}

////////////////////////////////////////////////////////////////////////////////

// Currently without astral characters support.
export function isPunctChar(ch) {
  return UNICODE_PUNCT_RE.test(ch);
}

// Markdown ASCII punctuation characters.
//
// !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @, [, \, ], ^, _, `, {, |, }, or ~
// http://spec.commonmark.org/0.15/#ascii-punctuation-character
//
// Don't confuse with unicode punctuation !!! It lacks some chars in ascii range.
//
export function isMdAsciiPunct(ch) {
  switch (ch) {
    case 0x21 /* ! */:
    case 0x22 /* " */:
    case 0x23 /* # */:
    case 0x24 /* $ */:
    case 0x25 /* % */:
    case 0x26 /* & */:
    case 0x27 /* ' */:
    case 0x28 /* ( */:
    case 0x29 /* ) */:
    case 0x2a /* * */:
    case 0x2b /* + */:
    case 0x2c /* , */:
    case 0x2d /* - */:
    case 0x2e /* . */:
    case 0x2f /* / */:
    case 0x3a /* : */:
    case 0x3b /* ; */:
    case 0x3c /* < */:
    case 0x3d /* = */:
    case 0x3e /* > */:
    case 0x3f /* ? */:
    case 0x40 /* @ */:
    case 0x5b /* [ */:
    case 0x5c /* \ */:
    case 0x5d /* ] */:
    case 0x5e /* ^ */:
    case 0x5f /* _ */:
    case 0x60 /* ` */:
    case 0x7b /* { */:
    case 0x7c /* | */:
    case 0x7d /* } */:
    case 0x7e /* ~ */:
      return true;
    default:
      return false;
  }
}

// Hepler to unify [reference labels].
//
export function normalizeReference(str) {
  // Trim and collapse whitespace
  //
  str = str.trim().replace(/\s+/g, ' ');

  // In node v10 'ẞ'.toLowerCase() === 'Ṿ', which is presumed to be a bug
  // fixed in v12 (couldn't find any details).
  //
  // So treat this one as a special case
  // (remove this when node v10 is no longer supported).
  //
  if ('ẞ'.toLowerCase() === 'Ṿ') {
    str = str.replace(/ẞ/g, 'ß');
  }

  // .toLowerCase().toUpperCase() should get rid of all differences
  // between letter variants.
  //
  // Simple .toLowerCase() doesn't normalize 125 code points correctly,
  // and .toUpperCase doesn't normalize 6 of them (list of exceptions:
  // İ, ϴ, ẞ, Ω, K, Å - those are already uppercased, but have differently
  // uppercased versions).
  //
  // Here's an example showing how it happens. Lets take greek letter omega:
  // uppercase U+0398 (Θ), U+03f4 (ϴ) and lowercase U+03b8 (θ), U+03d1 (ϑ)
  //
  // Unicode entries:
  // 0398;GREEK CAPITAL LETTER THETA;Lu;0;L;;;;;N;;;;03B8;
  // 03B8;GREEK SMALL LETTER THETA;Ll;0;L;;;;;N;;;0398;;0398
  // 03D1;GREEK THETA SYMBOL;Ll;0;L;<compat> 03B8;;;;N;GREEK SMALL LETTER SCRIPT THETA;;0398;;0398
  // 03F4;GREEK CAPITAL THETA SYMBOL;Lu;0;L;<compat> 0398;;;;N;;;;03B8;
  //
  // Case-insensitive comparison should treat all of them as equivalent.
  //
  // But .toLowerCase() doesn't change ϑ (it's already lowercase),
  // and .toUpperCase() doesn't change ϴ (already uppercase).
  //
  // Applying first lower then upper case normalizes any character:
  // '\u0398\u03f4\u03b8\u03d1'.toLowerCase().toUpperCase() === '\u0398\u0398\u0398\u0398'
  //
  // Note: this is equivalent to unicode case folding; unicode normalization
  // is a different step that is not required here.
  //
  // Final result should be uppercased, because it's later stored in an object
  // (this avoid a conflict with Object.prototype members,
  // most notably, `__proto__`)
  //
  return str.toLowerCase().toUpperCase();
}

////////////////////////////////////////////////////////////////////////////////

// Re-export libraries commonly used in both markdown-it and its plugins,
// so plugins won't have to depend on them explicitly, which reduces their
// bundled size (e.g. a browser build).
//
// exports.lib = {};
// exports.lib.mdurl = require("mdurl");
// exports.lib.ucmicro = require("uc.micro");

// exports.assign = assign;
// exports.isString = isString;
// exports.has = has;
// exports.unescapeMd = unescapeMd;
// exports.unescapeAll = unescapeAll;
// exports.isValidEntityCode = isValidEntityCode;
// exports.fromCodePoint = fromCodePoint;
// // exports.replaceEntities     = replaceEntities;
// exports.escapeHtml = escapeHtml;
// exports.arrayReplaceAt = arrayReplaceAt;
// exports.isSpace = isSpace;
// exports.isWhiteSpace = isWhiteSpace;
// exports.isMdAsciiPunct = isMdAsciiPunct;
// exports.isPunctChar = isPunctChar;
// exports.escapeRE = escapeRE;
// exports.normalizeReference = normalizeReference;
