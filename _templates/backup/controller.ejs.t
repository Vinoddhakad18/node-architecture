---
to: src/application/controllers/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.controller.ts
---

export class <%= h.changeCase.pascal(name) %>Controller {

  async getAll() {
    return [];
  }

}