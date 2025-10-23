// Validate file extension
export const validateFileType = (filename) => {
  const ext = filename.toLowerCase().split('.').pop();
  const allowedExtensions = ['csv', 'xlsx', 'xls'];
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed`);
  }
  return ext;
};

// Validate file format (check required columns)
export const validateFileFormat = (records) => {
  if (!records || records.length === 0) {
    throw new Error('The file is empty');
  }

  const firstRecord = records[0];
  const headers = Object.keys(firstRecord).map(h => h.toLowerCase());

  // Required columns (case-insensitive)
  const requiredColumns = ['firstname', 'phone', 'notes'];
  const missingColumns = requiredColumns.filter(col => 
    !headers.includes(col)
  );

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  return true;
};