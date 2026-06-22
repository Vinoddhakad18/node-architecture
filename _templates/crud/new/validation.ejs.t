---
to: src/application/validations/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.schema.ts
---

import { z } from "zod";

<%
const fieldList = (locals.fields || '')
  .split(',')
  .filter(Boolean);
%>

export const create<%= h.changeCase.pascal(name) %>Schema = z.object({
<%
fieldList.forEach(field => {
  const [fieldName, fieldType] = field.split(':');

  let zodType = 'z.string()';

  switch ((fieldType || '').trim()) {
    case 'number':
      zodType = 'z.number()';
      break;
    case 'boolean':
      zodType = 'z.boolean()';
      break;
    case 'date':
      zodType = 'z.coerce.date()';
      break;
    case 'email':
      zodType = 'z.string().email()';
      break;
    default:
      zodType = 'z.string()';
  }
%>
  <%= fieldName.trim() %>: <%= zodType %>,
<% }) %>
});

export type Create<%= h.changeCase.pascal(name) %>Dto =
  z.infer<typeof create<%= h.changeCase.pascal(name) %>Schema>;