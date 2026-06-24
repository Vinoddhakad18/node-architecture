---
to: src/tests/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.test.ts
---

import { describe, expect, test } from "@jest/globals";

describe("<%= h.changeCase.pascal(name) %> Service", () => {

  test("should return true", () => {
    expect(true).toBe(true);
  });

});