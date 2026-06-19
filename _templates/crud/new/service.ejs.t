---
to: src/application/services/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.service.ts
---

export class <%= h.changeCase.pascal(name) %>Service {

  async getAll() {
    return [];
  }

}