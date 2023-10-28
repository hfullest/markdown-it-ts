// Parse link destination
//

import { unescapeAll } from '../utils/utils';

export default function parseLinkDestination(str:string, start:number, max:number) {
  let code,
    level,
    pos = start,
    result = {
      ok: false,
      pos: 0,
      lines: 0,
      str: '',
    };

  if (str.charCodeAt(pos) === 0x3c /* < */) {
    pos++;
    while (pos < max) {
      code = str.charCodeAt(pos);
      if (code === 0x0a /* \n */) {
        return result;
      }
      if (code === 0x3c /* < */) {
        return result;
      }
      if (code === 0x3e /* > */) {
        result.pos = pos + 1;
        result.str = unescapeAll(str.slice(start + 1, pos));
        result.ok = true;
        return result;
      }
      if (code === 0x5c /* \ */ && pos + 1 < max) {
        pos += 2;
        continue;
      }

      pos++;
    }

    // no closing '>'
    return result;
  }

  // this should be ... } else { ... branch

  level = 0;
  while (pos < max) {
    code = str.charCodeAt(pos);

    if (code === 0x20) {
      break;
    }

    // ascii control characters
    if (code < 0x20 || code === 0x7f) {
      break;
    }

    if (code === 0x5c /* \ */ && pos + 1 < max) {
      if (str.charCodeAt(pos + 1) === 0x20) {
        break;
      }
      pos += 2;
      continue;
    }

    if (code === 0x28 /* ( */) {
      level++;
      if (level > 32) {
        return result;
      }
    }

    if (code === 0x29 /* ) */) {
      if (level === 0) {
        break;
      }
      level--;
    }

    pos++;
  }

  if (start === pos) {
    return result;
  }
  if (level !== 0) {
    return result;
  }

  result.str = unescapeAll(str.slice(start, pos));
  result.pos = pos;
  result.ok = true;
  return result;
};
