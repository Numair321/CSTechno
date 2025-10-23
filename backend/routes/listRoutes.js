import express from "express";
import multer from "multer";
import { uploadList, getLists } from "../controllers/listController.js";
import { protect } from "../middleware/authMiddleware.js";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.originalname.match(/\.(csv|xlsx|xls)$/)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV, XLSX, and XLS files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit to match frontend
  }
});

const router = express.Router();

// Simple logging middleware to confirm endpoint hits
const logUploadRequest = (req, res, next) => {
  console.log(`Upload endpoint hit by user: ${req.user ? req.user.email : 'unknown'}`);
  next();
};

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  console.error('Multer error:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

router.post("/upload", protect, logUploadRequest, upload.single("file"), handleMulterError, uploadList);
router.get("/", protect, getLists);
export default router;
