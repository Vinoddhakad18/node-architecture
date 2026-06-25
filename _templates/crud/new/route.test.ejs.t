---
to: src/tests/unit/routes/<%= h.changeCase.camel(name) %>.route.test.ts
---

import express from 'express';
import request from 'supertest';

import router from '@routes/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.route';
jest.mock(
  '@controllers/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.controller',
  () => ({
    <%= h.changeCase.pascal(name) %>Controller: jest.fn().mockImplementation(() => ({
      getAll: getAllMock,
      getById: getByIdMock,
      create: createMock,
      update: updateMock,
      delete: deleteMock,
    })),
  })
);