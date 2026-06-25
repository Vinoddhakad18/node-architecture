---
to: src/application/routers/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.swagger.ts
---

/**
 * @swagger
 * tags:
 *   name: <%= h.changeCase.pascal(name) %>
 *   description: <%= h.changeCase.pascal(name) %> APIs
 */

/**
 * @swagger
 * /api/<%= h.changeCase.camel(name) %>:
 *   get:
 *     summary: Get all <%= h.changeCase.camel(name) %>
 *     tags: [<%= h.changeCase.pascal(name) %>]
 *     responses:
 *       200:
 *         description: Success
 */