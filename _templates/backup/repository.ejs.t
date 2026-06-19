---
to: src/application/repositories/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.repository.ts
---

export class <%= h.changeCase.pascal(name) %>Repository {

  async findAll() {
    return [];
  }

}