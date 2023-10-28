import { Rule } from '../../interface';

export default (function inline(state) {
  // Parse inlines

  state.tokens.forEach((token) => {
    if (token.type === 'inline') state.md.inline.parse(token.content, state.md, state.env, token.children ?? []);
  });
} as Rule.CoreRule['fn']);
