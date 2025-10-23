import multer from 'multer';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure uploads directory exists
    const fs = require('fs');
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Remove special characters from original filename
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + cleanFileName);
  }
});

// File filter for type validation
const fileFilter = (req, file, cb) => {
  const ext = file.originalname.toLowerCase().split('.').pop();
  
  if (['csv', 'xlsx', 'xls'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV, XLSX, and XLS files are allowed'));
  }
};

// Create multer upload instance
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow one file at a time
  }
}).single('file'); // Configure for single file upload with field name 'file'

// Create a promise-based wrapper for the upload middleware
const uploadMiddleware = (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Multer error (e.g., file too large)
        reject({
          status: 400,
          message: `Upload error: ${err.message}`
        });
      } else if (err) {
        // Other errors
        reject({
          status: 500,
          message: err.message
        });
      }
      resolve(req.file);
    });
  });
};

export default uploadMiddleware;