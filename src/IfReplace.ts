import { isNullable } from 'koishi'

export class IfReplace<T> {
  inner: T;
  constructor(some: T) {
    this.inner = { ...some };
  }
  ifreplace<K extends keyof T>(
    what: K,
    some: T[K] | undefined,
  ): typeof this.ifreplace {
    if (!isNullable(some)) {
      this.inner[what] = some;
    }
    return (what: K, some: T[K]) => this.ifreplace(what, some);
  }
}
