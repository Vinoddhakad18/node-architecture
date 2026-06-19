---
to: src/application/dtos/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.dto.ts
---

<%
const fieldList = (locals.fields || '')
  .split(',')
  .filter(Boolean);
%>

export interface Create<%= h.changeCase.pascal(name) %>Dto {
<% fieldList.forEach(field => {
  const [fieldName, fieldType] = field.split(':');
%>
  <%= fieldName.trim() %>: <%= fieldType?.trim() || 'string' %>;
<% }) %>
}

export interface Update<%= h.changeCase.pascal(name) %>Dto {
<% fieldList.forEach(field => {
  const [fieldName, fieldType] = field.split(':');
%>
  <%= fieldName.trim() %>?: <%= fieldType?.trim() || 'string' %>;
<% }) %>
}