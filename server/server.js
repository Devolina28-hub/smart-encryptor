require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// File storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'encrypted_files/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'encrypted-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Data storage
const encryptionStore = new Map();

// Helper functions
function generatePasskey() {
  return crypto.randomBytes(16).toString('hex');
}

// API Endpoints
app.post('/api/encrypt/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const passkey = generatePasskey();
    encryptionStore.set(passkey, {
      type: 'image',
      path: req.file.path,
      originalName: req.file.originalname
    });

    res.json({ 
      success: true,
      message: 'Image encrypted successfully',
      passkey: passkey
    });
  } catch (error) {
    console.error('Image encryption error:', error);
    res.status(500).json({ error: 'Failed to encrypt image' });
  }
});

app.post('/api/encrypt/text', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const passkey = generatePasskey();
    encryptionStore.set(passkey, {
      type: 'text',
      data: text
    });

    res.json({ 
      success: true,
      message: 'Text encrypted successfully',
      passkey: passkey
    });
  } catch (error) {
    console.error('Text encryption error:', error);
    res.status(500).json({ error: 'Failed to encrypt text' });
  }
});

app.post('/api/decrypt/image', async (req, res) => {
  try {
    const { passkey } = req.body;
    if (!passkey) {
      return res.status(400).json({ error: 'No passkey provided' });
    }

    const encryptedData = encryptionStore.get(passkey);
    if (!encryptedData || encryptedData.type !== 'image') {
      return res.status(404).json({ error: 'Invalid passkey or data type' });
    }

    res.sendFile(path.resolve(encryptedData.path), {
      headers: {
        'Content-Disposition': `attachment; filename="${encryptedData.originalName}"`
      }
    });

    encryptionStore.delete(passkey);
  } catch (error) {
    console.error('Image decryption error:', error);
    res.status(500).json({ error: 'Failed to decrypt image' });
  }
});

app.post('/api/decrypt/text', async (req, res) => {
  try {
    const { passkey } = req.body;
    if (!passkey) {
      return res.status(400).json({ error: 'No passkey provided' });
    }

    const encryptedData = encryptionStore.get(passkey);
    if (!encryptedData || encryptedData.type !== 'text') {
      return res.status(404).json({ error: 'Invalid passkey or data type' });
    }

    res.json({ 
      success: true,
      data: encryptedData.data
    });

    encryptionStore.delete(passkey);
  } catch (error) {
    console.error('Text decryption error:', error);
    res.status(500).json({ error: 'Failed to decrypt text' });
  }
});

// Development-only admin route
if (process.env.NODE_ENV !== 'production') {
  app.get('/admin/files', (req, res) => {
    const files = [];
    encryptionStore.forEach((value, key) => {
      files.push({
        passkey: key,
        type: value.type,
        path: value.path || 'text-data',
        timestamp: new Date().toISOString()
      });
    });

    const physicalFiles = fs.readdirSync('encrypted_files/').map(file => ({
      name: file,
      path: path.join('encrypted_files', file)
    }));

    res.json({
      storedRecords: files,
      physicalFiles: physicalFiles
    });
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!fs.existsSync('encrypted_files')) {
    fs.mkdirSync('encrypted_files');
  }
});