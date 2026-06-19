---
inject: true
to: src/application/routes/index.ts
after: // HYGEN_ROUTES_USE
---

router.use(
  '/<%= h.changeCase.camel(name) %>s',
  <%= h.changeCase.camel(name) %>Routes
);
