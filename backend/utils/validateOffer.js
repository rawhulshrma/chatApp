// utils/validateOffer.js

const ErrorHandler = require('./errorHandler');

const validateOffer = (data) => {
  const { lead, number, year, currency, date, expire_date, note, items, sub_total, tax_value, total } = data;

  if (!lead || typeof lead !== 'string') {
    throw new ErrorHandler('Valid lead name is required', 400);
  }

  if (!number || typeof number !== 'string') {
    throw new ErrorHandler('Valid offer number is required', 400);
  }

  if (!year || !Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new ErrorHandler('Valid year between 2000 and 2100 is required', 400);
  }

  if (!currency || typeof currency !== 'string' || currency.length !== 3) {
    throw new ErrorHandler('Valid 3-letter currency code is required', 400);
  }

  if (!date || !isValidDate(date)) {
    throw new ErrorHandler('Valid date is required (YYYY-MM-DD)', 400);
  }

  if (!expire_date || !isValidDate(expire_date)) {
    throw new ErrorHandler('Valid expire date is required (YYYY-MM-DD)', 400);
  }

  if (new Date(expire_date) <= new Date(date)) {
    throw new ErrorHandler('Expire date must be after the offer date', 400);
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ErrorHandler('At least one item is required', 400);
  }

  items.forEach((item, index) => {
    if (!item.item || typeof item.item !== 'string') {
      throw new ErrorHandler(`Invalid item name for item ${index + 1}`, 400);
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new ErrorHandler(`Invalid quantity for item ${index + 1}`, 400);
    }
    if (typeof item.price !== 'number' || item.price <= 0) {
      throw new ErrorHandler(`Invalid price for item ${index + 1}`, 400);
    }
    if (typeof item.total !== 'number' || item.total <= 0) {
      throw new ErrorHandler(`Invalid total for item ${index + 1}`, 400);
    }
    if (Math.abs(item.quantity * item.price - item.total) > 0.01) {
      throw new ErrorHandler(`Total doesn't match quantity * price for item ${index + 1}`, 400);
    }
  });

  if (typeof sub_total !== 'number' || sub_total <= 0) {
    throw new ErrorHandler('Valid sub_total is required', 400);
  }

  if (typeof tax_value !== 'number' || tax_value < 0 || tax_value > 100) {
    throw new ErrorHandler('Valid tax_value between 0 and 100 is required', 400);
  }

  if (typeof total !== 'number' || total <= 0) {
    throw new ErrorHandler('Valid total is required', 400);
  }

  const calculatedTotal = items.reduce((sum, item) => sum + item.total, 0);
  if (Math.abs(calculatedTotal - sub_total) > 0.01) {
    throw new ErrorHandler('Sub-total doesn\'t match sum of item totals', 400);
  }

  const calculatedTotalWithTax = sub_total * (1 + tax_value / 100);
  if (Math.abs(calculatedTotalWithTax - total) > 0.01) {
    throw new ErrorHandler('Total doesn\'t match sub_total + tax', 400);
  }

  return { lead, number, year, currency, date, expire_date, note, items, sub_total, tax_value, total };
};

function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

module.exports = { validateOffer };