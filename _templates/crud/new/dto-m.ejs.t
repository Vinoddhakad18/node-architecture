---
to: src/application/dtos/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.dto.ts
---
import { <%= h.changeCase.pascal(name) %>Attributes } from '@models/<%= h.changeCase.camel(name) %>.model';
<%
const fieldList = (locals.fields || '')
  .split(',')
  .filter(Boolean);
%>

export interface Create<%= h.changeCase.pascal(name) %>Dto {
  <%= fieldName.trim() %>: <%= fieldType?.trim() || 'string' %>;
<% }) %>
}

export interface Update<%= h.changeCase.pascal(name) %>Dto {
  <%= fieldName.trim() %>: <%= fieldType?.trim() || 'string' %>;
<% }) %>
}