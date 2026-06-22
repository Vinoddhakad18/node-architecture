---
to: src/application/validations/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.scheme.ts
---

import { z } from 'zod';

<%
const skipFields = [
  'created_by',
  'updated_by',
  'created_at',
  'updated_at'
];

const fieldList = (locals.fields || '')
  .split(',')
  .filter(Boolean)
  .filter(field => {
    const fieldName = field.split(':')[0].trim();
    return !skipFields.includes(fieldName);
  });
%>

export const create<%= h.changeCase.pascal(name) %>Schema = z.object({
<%
fieldList.forEach(field => {
  const [fieldName, fieldType] = field.split(':');

  let zodType = 'z.string()';

  switch (fieldType?.trim()) {
    case 'number':
      zodType = 'z.number()';
      break;
    case 'boolean':
      zodType = 'z.boolean()';
      break;
    case 'date':
      zodType = 'z.coerce.date()';
      break;
  }
%>
  <%= fieldName.trim() %>: <%= zodType %>,
<% }) %>
});

export const update<%= h.changeCase.pascal(name) %>Schema =
  create<%= h.changeCase.pascal(name) %>Schema.partial();

export type Create<%= h.changeCase.pascal(name) %>Dto =
  z.infer<typeof create<%= h.changeCase.pascal(name) %>Schema>;

export type Update<%= h.changeCase.pascal(name) %>Dto =
  z.infer<typeof update<%= h.changeCase.pascal(name) %>Schema>;