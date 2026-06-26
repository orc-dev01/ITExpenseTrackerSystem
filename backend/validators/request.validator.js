const VALID_REQUEST_TYPES = new Set(['Expense', 'Purchase', 'Reimbursement']);
const MAX_LINE_ITEMS = 20;

function validateRequestCommand(body, referenceData) {
  const errors = [];
  const command = {
    title: requiredText(body.title, 'Title', errors, { min: 3, max: 120 }),
    justification: requiredText(body.justification, 'Justification', errors, { min: 10, max: 1000 }),
    department: requiredText(body.department, 'Department', errors, { max: 100 }),
    costCenter: requiredText(body.costCenter, 'Cost center', errors, { max: 50 }),
    project: optionalText(body.project, 'Project', errors, { max: 120 }),
    requestType: requiredText(body.requestType, 'Request type', errors, { max: 30 }),
    urgent: Boolean(body.urgent),
    lineItems: []
  };

  if (command.requestType && !VALID_REQUEST_TYPES.has(command.requestType)) {
    errors.push('Request type must be Expense, Purchase, or Reimbursement.');
  }

  validateReferenceValue(command.department, referenceData.departments, 'name', 'Department', errors);
  validateReferenceValue(command.costCenter, referenceData.costCenters, 'code', 'Cost center', errors);

  const rawItems = Array.isArray(body.lineItems) ? body.lineItems : [body.lineItem].filter(Boolean);
  if (rawItems.length === 0) {
    errors.push('At least one line item is required.');
  }

  if (rawItems.length > MAX_LINE_ITEMS) {
    errors.push(`A request can have a maximum of ${MAX_LINE_ITEMS} line items.`);
  }

  command.lineItems = rawItems.slice(0, MAX_LINE_ITEMS).map((item, index) =>
    validateLineItem(item, referenceData, errors, index + 1)
  );

  return {
    valid: errors.length === 0,
    errors,
    value: command
  };
}

function validateLineItem(body, referenceData, errors = [], itemNumber = 1) {
  const prefix = `Line item ${itemNumber}`;
  const lineItem = {
    id: optionalText(body.id, `${prefix} id`, errors, { max: 80 }),
    category: requiredText(body.category, `${prefix} category`, errors, { max: 80 }),
    categoryId: optionalText(body.categoryId, `${prefix} category id`, errors, { max: 80 }),
    description: requiredText(body.description, `${prefix} description`, errors, { min: 3, max: 200 }),
    vendor: optionalText(body.vendor, `${prefix} vendor`, errors, { max: 120 }),
    quantity: positiveNumber(body.quantity, `${prefix} quantity`, errors, { integer: true, max: 9999 }),
    unitAmount: positiveNumber(body.unitAmount, `${prefix} unit amount`, errors, { max: 999999999 }),
    sellerLink: optionalUrl(body.sellerLink, `${prefix} seller link`, errors)
  };

  validateReferenceValue(lineItem.category, referenceData.categories, 'name', `${prefix} category`, errors);
  lineItem.lineTotal = lineItem.quantity * lineItem.unitAmount;
  return lineItem;
}

function requiredText(value, label, errors, options = {}) {
  const text = String(value ?? '').trim();
  if (!text) {
    errors.push(`${label} is required.`);
    return '';
  }

  return validateTextLength(text, label, errors, options);
}

function optionalText(value, label, errors, options = {}) {
  const text = String(value ?? '').trim();
  if (!text) {
    return undefined;
  }

  return validateTextLength(text, label, errors, options);
}

function validateTextLength(text, label, errors, options) {
  if (options.min && text.length < options.min) {
    errors.push(`${label} must be at least ${options.min} characters.`);
  }

  if (options.max && text.length > options.max) {
    errors.push(`${label} must be ${options.max} characters or fewer.`);
  }

  return text;
}

function positiveNumber(value, label, errors, options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    errors.push(`${label} must be greater than 0.`);
    return 0;
  }

  if (options.integer && !Number.isInteger(number)) {
    errors.push(`${label} must be a whole number.`);
  }

  if (options.max && number > options.max) {
    errors.push(`${label} must be ${options.max} or less.`);
  }

  return number;
}

function optionalUrl(value, label, errors) {
  const text = String(value ?? '').trim();
  if (!text) {
    return undefined;
  }

  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) {
      errors.push(`${label} must start with http:// or https://.`);
    }
  } catch {
    errors.push(`${label} must be a valid URL.`);
  }

  return text;
}

function validateReferenceValue(value, collection, field, label, errors) {
  if (!value || !Array.isArray(collection)) {
    return;
  }

  const exists = collection.some((item) => String(item[field]).toLowerCase() === String(value).toLowerCase());
  if (!exists) {
    errors.push(`${label} is not in the allowed list.`);
  }
}

module.exports = {
  validateLineItem,
  validateRequestCommand
};
