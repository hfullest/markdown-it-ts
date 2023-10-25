import { Token } from "../basic/token";
import { EnvSandbox } from "../interface";
import { MarkdownIt } from "../markdown-it";

export class StateCore {
  tokens: Token[] = [];

  Token = Token;

  inlineMode: boolean = false;

  constructor(
    public src: string,
    public md: MarkdownIt,
    public env: EnvSandbox
  ) {}
}
