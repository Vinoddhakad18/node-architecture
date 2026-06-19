---
to: src/application/repositories/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.repository.ts
---

import { <%= h.changeCase.pascal(name) %> } from '@/repositories/<%= h.changeCase.camel(name) %>.repository';

export class <%= h.changeCase.pascal(name) %>Repository {

  async create(payload: any) {
    return <%= h.changeCase.pascal(name) %>.create(payload);
  }

  async findById(id: number) {
    return <%= h.changeCase.pascal(name) %>.findByPk(id);
  }

  async findAll() {
    return <%= h.changeCase.pascal(name) %>.findAll();
  }

  async update(id: number, payload: any) {
    await <%= h.changeCase.pascal(name) %>.update(payload, {
      where: { id }
    });

    return this.findById(id);
  }

  async delete(id: number) {
    return <%= h.changeCase.pascal(name) %>.destroy({
      where: { id }
    });
  }
}