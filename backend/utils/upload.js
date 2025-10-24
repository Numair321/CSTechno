import multer from 'multer';

 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + cleanFileName);
  }
});
 
const fileFilter = (req, file, cb) => {
  const ext = file.originalname.toLowerCase().split('.').pop();
  
  if (['csv', 'xlsx', 'xls'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV, XLSX, and XLS files are allowed'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,  
    files: 1  
  }
}).single('file');  
 
const uploadMiddleware = (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        reject({
          status: 400,
          message: `Upload error: ${err.message}`
        });
      } else if (err) {
         
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