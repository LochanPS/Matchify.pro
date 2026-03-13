// Indian Date Format Utilities
// Format: DD/MM/YYYY or DD-MM-YYYY

/**
 * Format date to Indian format (DD/MM/YYYY)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateIndian = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format date to Indian format with time (DD/MM/YYYY, HH:MM AM/PM)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTimeIndian = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  
  return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
};

/**
 * Format date to Indian long format (DD Month YYYY)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateLongIndian = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Format date to Indian short format (DD Mon YYYY)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateShortIndian = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format currency to Indian Rupees
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrencyIndian = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format number to Indian format (with lakhs and crores)
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumberIndian = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};
