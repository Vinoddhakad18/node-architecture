---
inject: true
to: src/application/constants/rbac.constants.ts
after: "// HYGEN_API_ROUTES"
---

  <%= h.changeCase.constantCase(name) %>: '/admin/<%= h.changeCase.camel(name) + 's' %>',