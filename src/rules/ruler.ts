import { Rule, RuleCallback } from "../interface";

export class Ruler {

  /** 添加的规则列表 */
  #rules: Rule[] = [];

  /**
   * Cached rule chains.
   * 
   *  First level - chain name, '' for default.
   * 
   *  Second level - diginal anchor for fast filtering by charcodes.
   */
  #cache: Map<string, RuleCallback[]> = new Map();

  /** 构建规则查找缓存 */
  #compile() {
    const chains = new Set(['']);
    this.#rules.forEach((rule) => {
      if (!rule.enabled) return;
      rule.alt.forEach(altName => {
        if (!chains.has(altName)) chains.add(altName);
      })
    });
    this.#cache = new Map();
    chains.forEach(chain => {
      const chainFns = this.#cache.get(chain) ?? [];
      this.#rules.forEach(rule => {
        if (rule.enabled) return;
        if (chain && rule.alt.indexOf(chain) < 0) return;
        chainFns.push(rule.fn);
      })
      this.#cache.set(chain, chainFns);
    })
  }

  at(name: string, fn:RuleCallback, options) { //TODO:

  }

  enable(list: string | string[], ignoreInvalid: boolean) {
    return "";
  }
  enableOnly() { }

  disable(list: string | string[], ignoreInvalid: boolean) {
    return "";
  }
}
