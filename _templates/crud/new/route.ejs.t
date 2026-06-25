---
to: src/application/routes/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.route.ts
---

import { Router } from 'express';
import { <%= h.changeCase.pascal(name) %>Controller } from '@/application/controllers/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.controller';
import { attachPermissions, authenticate, requirePermission } from '@middleware/auth.middleware';
import { MenuRoute, PermissionAction } from '@application/constants';
import {create<%= h.changeCase.pascal(name) %>Schema, update<%= h.changeCase.pascal(name) %>Schema} from '@application/validations/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.scheme';
const router = Router();
const controller = new <%= h.changeCase.pascal(name) %>Controller();
import { validateRequest } from '@middleware/validateRequest';

<%
const fieldList = (locals.fields || '').split(',');
const swaggerFields = fieldList.filter(field => {
  const [fieldName] = field.split(':');
  return !fieldName.startsWith('created_') &&
         !fieldName.startsWith('updated_');
});
%>
/**
 * @swagger
 * tags:
 *   name: <%= h.changeCase.pascal(name) %>
 *   description: <%= h.changeCase.pascal(name) %> Management APIs
 */

/**
 * @swagger
 * /<%= h.changeCase.kebab(name) %>:
 *   post:
 *     summary: Create <%= h.changeCase.pascal(name) %>
 *     tags: [<%= h.changeCase.pascal(name) %>]
 *     security:
 *       - bearerAuth: []
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
<%
swaggerFields.forEach(field => {
  const [fieldName, fieldType] = field.split(':');
%>
 *               <%= fieldName %>:
 *                 type: <%= fieldType === 'number' ? 'integer' : fieldType === 'boolean' ? 'boolean' : 'string' %>
 *                 example: <%= fieldType === 'number' ? 1 : fieldType === 'boolean' ? 'true' : 'sample value' %>
<%
});
%>
 *     responses:
 *       201:
 *         description: Created successfully
 */
router.post('/', authenticate, validateRequest(create<%= h.changeCase.pascal(name) %>Schema), requirePermission(MenuRoute.<%= h.changeCase.constantCase(name) %>, PermissionAction.ADD),
  attachPermissions(MenuRoute.<%= h.changeCase.constantCase(name) %>), controller.create);

/**
 * @swagger
 * /<%= h.changeCase.kebab(name) %>:
 *   get:
 *     summary: Get all <%= h.changeCase.pascal(name) %>
 *     tags: [<%= h.changeCase.pascal(name) %>]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: <%= h.changeCase.pascal(name) %> retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Fetch successfully
 *                 data:
 *                   type: array
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', authenticate, requirePermission(MenuRoute.<%= h.changeCase.constantCase(name) %>, PermissionAction.VIEW),
  attachPermissions(MenuRoute.<%= h.changeCase.constantCase(name) %>), controller.getAll);

/**
 * @swagger
 * /<%= h.changeCase.kebab(name) %>/{id}:

 *   get:
 *     summary: Get <%= h.changeCase.pascal(name) %> by ID
 *     tags: [<%= h.changeCase.pascal(name) %>]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: <%= h.changeCase.pascal(name) %> retrieved successfully
 */
router.get('/:id', authenticate, requirePermission(MenuRoute.<%= h.changeCase.constantCase(name) %>, PermissionAction.VIEW),
  attachPermissions(MenuRoute.<%= h.changeCase.constantCase(name) %>), controller.getById);

/**
 * @swagger
 * /<%= h.changeCase.kebab(name) %>/{id}:
 *   put:
 *     summary: Update <%= h.changeCase.pascal(name) %>
 *     tags: [<%= h.changeCase.pascal(name) %>]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
<%
swaggerFields.forEach(field => {
  const [fieldName, fieldType] = field.split(':');
%>
 *               <%= fieldName %>:
 *                 type: <%= fieldType === 'number' ? 'integer' : fieldType === 'boolean' ? 'boolean' : 'string' %>
 *                 example: <%= fieldType === 'number' ? 1 : fieldType === 'boolean' ? 'true' : 'sample value' %>
<%
});
%>
 *     responses:
 *       200:
 *         description: Updated successfully
 */
router.put('/:id', authenticate, validateRequest(update<%= h.changeCase.pascal(name) %>Schema), requirePermission(MenuRoute.<%= h.changeCase.constantCase(name) %>, PermissionAction.EDIT),
  attachPermissions(MenuRoute.<%= h.changeCase.constantCase(name) %>), controller.update);

/**
 * @swagger
 * /<%= h.changeCase.kebab(name) %>/{id}:
 *   delete:
 *     summary: Delete <%= h.changeCase.pascal(name) %>
 *     tags: [<%= h.changeCase.pascal(name) %>]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted successfully
 */
router.delete('/:id', authenticate, requirePermission(MenuRoute.<%= h.changeCase.constantCase(name) %>, PermissionAction.DELETE),
  attachPermissions(MenuRoute.<%= h.changeCase.constantCase(name) %>), controller.delete);

export default router;