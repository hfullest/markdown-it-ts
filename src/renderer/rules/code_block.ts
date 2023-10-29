import { Rule } from '../../interface';
import { escapeHtml } from '../../utils/utils';

export default ((tokens, idx, _options, _env, slf) => {
  const token = tokens[idx];
  return `<pre ${slf.renderAttrs(token)}><code>${escapeHtml(tokens[idx].content)}</code></pre>\n`;
}) as Rule.RenderRule['fn'];
