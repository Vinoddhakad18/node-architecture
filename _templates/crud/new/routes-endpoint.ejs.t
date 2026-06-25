---
inject: true
to: src/application/routes/index.ts
after: "// HYGEN_ENDPOINTS"
---

        <%=h.changeCase.camel(name)  %>: '/<%= h.changeCase.camel(name) %>',