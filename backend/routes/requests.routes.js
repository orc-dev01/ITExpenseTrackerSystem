const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const path = require('path');
const store = require('../store');
const { requireAnyRole, requireAuth } = require('../middleware/auth.middleware');
const { validateLineItem, validateRequestCommand } = require('../validators/request.validator');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads');
const maxUploadBytes = 5 * 1024 * 1024;

router.use(requireAuth);

router.get('/', async (req, res) => {
  return res.json(await store.listRequestsForUser(req.user));
});

router.post('/drafts', requireAnyRole(['Requester', 'Admin']), async (req, res) => {
  const validation = validateRequestCommand(req.body, await referenceState());
  if (!validation.valid) {
    return validationError(res, validation.errors);
  }

  const request = await store.createRequest(validation.value, req.user, false);
  return res.status(201).json(request);
});

router.post('/submit', requireAnyRole(['Requester', 'Admin']), async (req, res) => {
  if (req.body.id) {
    const existing = await store.findRequest(req.body.id);
    if (!existing) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    const action = existing.status === 'Returned' ? 'Resubmitted' : 'Submitted';
    const result = await store.transitionRequestStrict(req.body.id, req.user, 'PendingEndorsement', action, undefined, {
      fromStatuses: ['Draft', 'Returned'],
      ownerOnly: true,
      requiredRoles: ['Requester']
    });
    return sendTransitionResult(res, result);
  }

  const validation = validateRequestCommand(req.body, await referenceState());
  if (!validation.valid) {
    return validationError(res, validation.errors);
  }

  const request = await store.createRequest(validation.value, req.user, true);
  return res.status(201).json(request);
});

router.patch('/:id/draft', requireAnyRole(['Requester', 'Admin']), async (req, res) => {
  const validation = validateRequestCommand(req.body, await referenceState());
  if (!validation.valid) {
    return validationError(res, validation.errors);
  }

  const request = await store.updateDraft(req.params.id, validation.value, req.user);
  return request ? res.json(request) : res.status(404).json({ message: 'Request not found or cannot be edited.' });
});

router.delete('/:id/draft', requireAnyRole(['Requester', 'Admin']), async (req, res) => {
  const deleted = await store.deleteDraft(req.params.id, req.user);
  return deleted ? res.status(204).send() : res.status(404).json({ message: 'Draft request not found or cannot be deleted.' });
});

router.get('/:id', async (req, res) => {
  const request = await store.findRequest(req.params.id);
  if (!request || !(await store.userCanReadRequest(req.user, request))) {
    return res.status(404).json({ message: 'Request not found.' });
  }

  return res.json(request);
});

router.post('/:id/cancel', requireAnyRole(['Requester', 'Admin']), async (req, res) => {
  const result = await store.transitionRequestStrict(req.params.id, req.user, 'Cancelled', 'Cancelled', req.body.remarks, {
    fromStatuses: ['Draft', 'Returned', 'PendingEndorsement'],
    ownerOnly: true,
    requiredRoles: ['Requester']
  });
  return sendTransitionResult(res, result);
});

router.get('/:requestId/line-items', async (req, res) => {
  const request = await store.findRequest(req.params.requestId);
  if (!request || !(await store.userCanReadRequest(req.user, request))) {
    return res.status(404).json({ message: 'Request not found.' });
  }

  return res.json(request.lineItems);
});

router.post('/:requestId/line-items', requireAnyRole(['Requester', 'Admin']), async (req, res) => {
  const request = await store.findRequest(req.params.requestId);
  if (!request) {
    return res.status(404).json({ message: 'Request not found.' });
  }

  if (!store.canEditRequest(req.user, request)) {
    return res.status(403).json({ message: 'Line items can only be changed by the requester while the request is Draft or Returned.' });
  }

  const errors = [];
  const validLineItem = validateLineItem(req.body, await referenceState(), errors);
  if (errors.length) {
    return validationError(res, errors);
  }

  if (store.addLineItem) {
    const lineItem = await store.addLineItem(request.id, validLineItem);
    return res.status(201).json(lineItem);
  }

  const lineItem = {
    id: crypto.randomUUID(),
    ...validLineItem
  };
  request.lineItems.push(lineItem);
  request.totalAmount = request.lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  request.updatedAt = new Date().toISOString();
  return res.status(201).json(lineItem);
});

router.get('/:requestId/line-items/:lineItemId/attachments', async (req, res) => {
  const result = await store.findLineItem(req.params.requestId, req.params.lineItemId);
  if (!result || !(await store.userCanReadRequest(req.user, result.request))) {
    return res.status(404).json({ message: 'Line item not found.' });
  }

  return res.json(await store.listAttachments(result.request.id, result.lineItem.id));
});

router.post('/:requestId/line-items/:lineItemId/attachments', requireAnyRole(['Requester', 'Admin']), async (req, res) => {
  const result = await store.findLineItem(req.params.requestId, req.params.lineItemId);
  if (!result || !(await store.userCanReadRequest(req.user, result.request))) {
    return res.status(404).json({ message: 'Line item not found.' });
  }

  if (!store.canUploadAttachment(req.user, result.request)) {
    return res.status(403).json({ message: 'Attachments can only be uploaded by the requester while the request is Draft or Returned.' });
  }

  const fileName = String(req.body.fileName ?? '').trim();
  const contentType = String(req.body.contentType ?? 'application/octet-stream');
  const contentBase64 = String(req.body.contentBase64 ?? '').replace(/^data:.*;base64,/, '');

  if (!fileName || !contentBase64) {
    return res.status(400).json({ message: 'File name and file content are required.' });
  }

  const buffer = Buffer.from(contentBase64, 'base64');
  if (!buffer.length || buffer.length > maxUploadBytes) {
    return res.status(400).json({ message: 'File must be greater than 0 bytes and no larger than 5 MB.' });
  }

  fs.mkdirSync(uploadDir, { recursive: true });
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storedName = `${crypto.randomUUID()}-${safeName}`;
  const storagePath = path.join(uploadDir, storedName);
  fs.writeFileSync(storagePath, buffer);

  const attachment = await store.addAttachment({
    requestId: result.request.id,
    lineItemId: result.lineItem.id,
    fileName,
    contentType,
    size: buffer.length,
    storagePath
  }, req.user);

  return res.status(201).json(attachment);
});

router.get('/:requestId/line-items/:lineItemId/links', async (req, res) => {
  const request = await store.findRequest(req.params.requestId);
  if (!request || !(await store.userCanReadRequest(req.user, request))) {
    return res.status(404).json({ message: 'Line item not found.' });
  }

  const lineItem = request?.lineItems.find((item) => item.id === req.params.lineItemId);
  return lineItem ? res.json([{ type: 'Other', url: lineItem.sellerLink }].filter((link) => link.url)) : res.status(404).json({ message: 'Line item not found.' });
});

module.exports = router;

function validationError(res, errors) {
  return res.status(400).json({
    message: 'Please fix the request fields before continuing.',
    errors
  });
}

function sendTransitionResult(res, result) {
  return result.ok ? res.json(result.request) : res.status(result.status).json({ message: result.message });
}

async function referenceState() {
  return store.getValidationState ? store.getValidationState() : store.state;
}
