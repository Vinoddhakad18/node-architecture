---
to: src/application/routes/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.route.ts
---

import { Router } from 'express';
import { <%= h.changeCase.pascal(name) %>Controller } from '@/application/controllers/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.controller';
import { attachPermissions, authenticate, requirePermission } from '@middleware/auth.middleware';
import { MenuRoute, PermissionAction } from '@application/constants';
import {create<%= h.changeCase.pascal(name) %>Schema, update<%= h.changeCase.pascal(name) %>Schema} from '@application/validations/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.scheme';
const router = Router();
const controller = ''; //new <%= h.changeCase.pascal(name) %>Controller();
import { validateRequest } from '@middleware/validateRequest';

/**
 * @swagger
 * tags:
 *   name: <%= h.changeCase.pascal(name) %>
 *   description: <%= h.changeCase.pascal(name) %> Management APIs
 */

/**
 * @swagger
 * /api/<%= h.changeCase.kebab(name) %>:
 *   post:
 *     summary: Create <%= h.changeCase.pascal(name) %>
 *     tags: [<%= h.changeCase.pascal(name) %>]
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Created successfully
 */
router.post('/', validateRequest(create<%= h.changeCase.pascal(name) %>Schema), requirePermission(MenuRoute.<%= h.changeCase.constantCase(name) %>, PermissionAction.ADD),
  attachPermissions(MenuRoute.<%= h.changeCase.constantCase(name) %>),authenticate, {console.log('controller.create')}); //controller.create);

/**
 * @swagger
 * /api/<%= h.changeCase.kebab(name) %>:
 *   get:
 *     summary: Get all <%= h.changeCase.pascal(name) %>
 *     tags: [<%= h.changeCase.pascal(name) %>]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', requirePermission(MenuRoute.<%= h.changeCase.constantCase(name) %>, PermissionAction.VIEW),
  attachPermissions(MenuRoute.<%= h.changeCase.constantCase(name) %>),authenticate, {console.log('controller.getAll')}); //controller.getAll);

/**
 * @swagger
 * /api/<%= h.changeCase.kebab(name) %>/{id}:
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
 *         description: Success
 */
router.get('/:id', requirePermission(MenuRoute.<%= h.changeCase.constantCase(name) %>, PermissionAction.VIEW),
  attachPermissions(MenuRoute.<%= h.changeCase.constantCase(name) %>),authenticate, {console.log('controller.getById')}); //controller.getById);

/**
 * @swagger
 * /api/<%= h.changeCase.kebab(name) %>/{id}:
 *   put:
 *     summary: Update <%= h.changeCase.pascal(name) %>
 *     tags: [<%= h.changeCase.pascal(name) %>]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Updated successfully
 */
router.put('/:id', validateRequest(update<%= h.changeCase.pascal(name) %>Schema), requirePermission(MenuRoute.<%= h.changeCase.constantCase(name) %>, PermissionAction.EDIT),
  attachPermissions(MenuRoute.<%= h.changeCase.constantCase(name) %>),authenticate, {console.log('controller.update')}); //controller.update);

/**
 * @swagger
 * /api/<%= h.changeCase.kebab(name) %>/{id}:
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
router.delete('/:id', requirePermission(MenuRoute.<%= h.changeCase.constantCase(name) %>, PermissionAction.DELETE),
  attachPermissions(MenuRoute.<%= h.changeCase.constantCase(name) %>),authenticate, {console.log('controller.delete')}); //controller.delete);

export default router;