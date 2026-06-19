---
to: src/modules/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.model.ts
---

export interface <%= h.changeCase.pascal(name) %> {
  id: number;
}