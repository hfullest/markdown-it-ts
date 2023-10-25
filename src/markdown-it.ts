import { Components, Config, Options, PresetNameType } from "./interface";
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
      Object.entries(components).forEach(
        ([name, { rules, rules2 }]: [string, Components[keyof Components]]) => {
          if (rules) this[name].ruler.enableOnly(rules);
          if (rules2) this[name].ruler.enableOnly(rules2);
        }
      );
    }
    return this;
  }

  /** 设置配置 */
  set(options: Options) {
    this.options = Object.assign(this.options, options);
    return this;
  }
}
