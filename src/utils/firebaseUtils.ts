export const sanitizeDataForFirebase = (data: any): any => {
  if (!data) return {};

  const cleanObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    const cleaned: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      const value = obj[key];
      if (value === undefined) continue;

      if (value instanceof Date) {
        cleaned[key] = value.getTime() / 1000; // Convert to UNIX timestamp (seconds)
      } else if (typeof value === 'object' && value !== null) {
        const cleanedValue = cleanObject(value);
        if (cleanedValue && Object.keys(cleanedValue).length > 0) {
          cleaned[key] = cleanedValue;
        }
      } else if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        cleaned[key] = value;
      }
    }

    if (Array.isArray(cleaned) && cleaned.length === 0) return undefined;
    if (Object.keys(cleaned).length === 0) return undefined;

    return cleaned;
  };

  return cleanObject(data) || {};
};
export const validateFirebaseData = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;

  const validateValue = (value: any): boolean => {
    if (value === null) return true;
    if (value === undefined || typeof value === 'function') return false;

    if (value instanceof Date) return true; // Accept dates as UNIX timestamp

    if (Array.isArray(value)) {
      return value.every(validateValue);
    }

    if (typeof value === 'object') {
      return Object.values(value).every(validateValue);
    }

    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    );
  };

  return validateValue(data);
};
