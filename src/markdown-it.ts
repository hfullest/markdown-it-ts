import {
  Config,
  EnvSandbox,
  Options,
  Plugin,
  PresetNameType,
} from "./interface";
import { ParserBlock } from "./parser/block";
import { ParserCore } from "./parser/core";
import { ParserInline } from "./parser/inline";
import { Renderer } from "./renderer";
import LinkifyIt from "linkify-it";
import { normalizeLink, normalizeLinkText, utils, validateLink } from "./utils";
import * as helpers from "./helpers";
import presetsConfig from "./presets";

export class MarkdownIt {
  core = new ParserCore();

  block = new ParserBlock();

  inline = new ParserInline();

  renderer = new Renderer();

  /**
   *
   * [linkify-it](https://github.com/markdown-it/linkify-it) 实例.
   **/
  linkify = new LinkifyIt();

  utils = utils;

  helpers = helpers;

  options: Options = presetsConfig["default"]["options"]!;

  /** 链接检验方法 */
  validateLink = validateLink;

  normalizeLink = normalizeLink;

  normalizeLinkText = normalizeLinkText;

  constructor(presetName: PresetNameType, options: Options) {
    if (!(this instanceof MarkdownIt))
      return new MarkdownIt(presetName, options);
    if (!options) {
      if (typeof presetName !== "string") {
        options = presetName ?? {};
        presetName = "default";
      }
    } else {
      this.options = options;
    }
    this.#configure(presetName);
  }

  /** 配置 */
  #configure(presetName: PresetNameType) {
    let preset: Config | null = null;

    if (typeof presetName === "string") {
      preset = presetsConfig[presetName];
      if (!presetName) {
        throw new Error(
          'Wrong `markdown-it` preset "' + presetName + '", check name'
        );
      }
    }

    if (!preset) {
      throw new Error("Wrong `markdown-it` preset, can't be empty");
    }
    const { options, components } = preset;

    if (options) {
      this.set(options);
    }

    if (components) {
      Object.entries(components).forEach(([name, { rules, rules2 }]) => {
        if (rules) this[name].ruler.enableOnly(rules);
        if (rules2) this[name].ruler.enableOnly(rules2);
      });
    }
    return this;
  }

  #parse(src: string, env: Record<string, any>) {
    if (typeof src !== "string") {
      throw new Error("Input data should be a String");
    }

    const state = new this.core.State(src, this, env);

    this.core.process(state);

    return state.tokens;
  }

  /** 设置配置 */
  set(options: Options) {
    this.options = Object.assign(this.options, options);
    return this;
  }

  use(plugin: Plugin, ...params: any[]) {
    if (typeof plugin === "function") plugin(this, params);
    return this;
  }

  enable(list: string | string[], ignoreInvalid: boolean) {
    let result: string[] = [];

    if (!Array.isArray(list)) {
      list = [list];
    }

    ["core", "block", "inline"].forEach((chain) => {
      result = result.concat(this[chain].ruler.enable(list, true));
    });

    result = result.concat(this.inline.ruler2.enable(list, true));

    const missed = list.filter(function (name) {
      return result.indexOf(name) < 0;
    });

    if (missed.length && !ignoreInvalid) {
      throw new Error(
        "MarkdownIt. Failed to enable unknown rule(s): " + missed
      );
    }

    return this;
  }

  disable(list: string | string[], ignoreInvalid: boolean) {
    let result: string[] = [];

    if (!Array.isArray(list)) {
      list = [list];
    }

    ["core", "block", "inline"].forEach((chain) => {
      result = result.concat(this[chain].ruler.disable(list, true));
    });

    result = result.concat(this.inline.ruler2.disable(list, true));

    const missed = list.filter(function (name) {
      return result.indexOf(name) < 0;
    });

    if (missed.length && !ignoreInvalid) {
      throw new Error(
        "MarkdownIt. Failed to disable unknown rule(s): " + missed
      );
    }
    return this;
  }

  #parseInline(src: string, env: EnvSandbox) {
    const state = new this.core.State(src, this, env);
    state.inlineMode = true;
    this.core.process(state);
    return state.tokens;
  }

  renderInline(src: string, env: EnvSandbox) {
    env = env ?? {};
    return this.renderer.render(this.#parseInline(src, env), this.options, env);
  }

  render(src: string, env: EnvSandbox) {
    env = env ?? {};
    return this.renderer.render(this.#parse(src, env), this.options, env);
  }
}
