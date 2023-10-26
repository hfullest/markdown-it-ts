import { Ruler } from '../rules/ruler';
import { StateBlock } from '../state/block';
import tableFn from '../rules/block/table';

export class ParserBlock {
  ruler = new Ruler([
    { name: 'table', fn: tableFn, enabled: true, alt: ['paragraph', 'reference'] },
    { name: 'code', fn: tableFn, enabled: true },
    { name: 'fence', fn: tableFn, enabled: true, alt: ['paragraph', 'reference', 'blockquote', 'list'] },
    { name: 'blockquote', fn: tableFn, enabled: true, alt: ['paragraph', 'reference', 'blockquote', 'list'] },
    { name: 'hr', fn: tableFn, enabled: true, alt: ['paragraph', 'reference', 'blockquote', 'list'] },
    { name: 'list', fn: tableFn, enabled: true, alt: ['paragraph', 'reference', 'blockquote'] },
  ]);

  ruler2 = new Ruler();

  State = StateBlock;
}
