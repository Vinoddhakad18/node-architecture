---
inject: true
to: src/application/routes/index.ts
after: // HYGEN_IMPORTS
---

import <%= h.changeCase.camel(name) %>Routes from './<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.route';