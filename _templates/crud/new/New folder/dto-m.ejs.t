---
to: src/application/dtos/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.dto.ts
---

import { <%= h.changeCase.pascal(name) %>Attributes } from '@models/<%= h.changeCase.camel(name) %>.model';

<%
const fieldList = (locals.fields || '')
  .split(',')
  .filter(Boolean);

const tsTypeMap = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  date: 'Date',
};

const getTsType = (type) => tsTypeMap[type?.trim()] || 'string';
%>

/**
 * <%= h.changeCase.pascal(name) %> Response DTO
 */
export class <%= h.changeCase.pascal(name) %>ResponseDTO {
<%
fieldList.forEach(field => {
  const [fieldName, fieldType] = field.split(':');
%>
  <%= fieldName.trim() %>: <%= getTsType(fieldType) %>;
<%
});
%>

  constructor(model: <%= h.changeCase.pascal(name) %>Attributes) {
<%
fieldList.forEach(field => {
  const [fieldName] = field.split(':');
%>
    this.<%= fieldName.trim() %> = model.<%= fieldName.trim() %>;
<%
});
%>
  }

  static fromModel(
    model: <%= h.changeCase.pascal(name) %>Attributes
  ): <%= h.changeCase.pascal(name) %>ResponseDTO {
    return new <%= h.changeCase.pascal(name) %>ResponseDTO(model);
  }

  static fromModels(
    models: <%= h.changeCase.pascal(name) %>Attributes[]
  ): <%= h.changeCase.pascal(name) %>ResponseDTO[] {
    return models.map((model) => <%= h.changeCase.pascal(name) %>ResponseDTO.fromModel(model));
  }
}

/**
 * <%= h.changeCase.pascal(name) %> Summary DTO
 */
export class <%= h.changeCase.pascal(name) %>SummaryDTO {
  id: number;

<%
fieldList.slice(0, 2).forEach(field => {
  const [fieldName, fieldType] = field.split(':');
%>
  <%= fieldName.trim() %>: <%= getTsType(fieldType) %>;
<%
});
%>

  constructor(model: <%= h.changeCase.pascal(name) %>Attributes) {
    this.id = model.id;

<%
fieldList.slice(0, 2).forEach(field => {
  const [fieldName] = field.split(':');
%>
    this.<%= fieldName.trim() %> = model.<%= fieldName.trim() %>;
<%
});
%>
  }

  static fromModel(
    model: <%= h.changeCase.pascal(name) %>Attributes
  ): <%= h.changeCase.pascal(name) %>SummaryDTO {
    return new <%= h.changeCase.pascal(name) %>SummaryDTO(model);
  }

  static fromModels(
    models: <%= h.changeCase.pascal(name) %>Attributes[]
  ): <%= h.changeCase.pascal(name) %>SummaryDTO[] {
    return models.map((model) => <%= h.changeCase.pascal(name) %>SummaryDTO.fromModel(model));
  }
}

/**
 * Create <%= h.changeCase.pascal(name) %> Request DTO
 */
export interface Create<%= h.changeCase.pascal(name) %>RequestDTO {
<%
fieldList.forEach(field => {
  const [fieldName, fieldType] = field.split(':');
%>
  <%= fieldName.trim() %>: <%= getTsType(fieldType) %>;
<%
});
%>
}

/**
 * Update <%= h.changeCase.pascal(name) %> Request DTO
 */
export interface Update<%= h.changeCase.pascal(name) %>RequestDTO {
<%
fieldList.forEach(field => {
  const [fieldName, fieldType] = field.split(':');
%>
  <%= fieldName.trim() %>?: <%= getTsType(fieldType) %>;
<%
});
%>
}
