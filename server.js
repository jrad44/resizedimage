import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import archiver from 'archiver';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.disable('x-powered-by');
app.use(cookieParser());
app.set('trust proxy', 1);
app.use(rateLimit({ windowMs: 60*60*1000, max: 300 }));
app.use(express.static(__dirname, { index: false }));
app.use((req,res,next)=>{ res.setHeader('Cache-Control','no-store'); next(); });

const validTokens = new Set(
  (process.env.PRO_TOKENS || '')
    .split(',')
    .map(s=>s.trim())
    .filter(Boolean)
);

const upload = multer({ limits: { fileSize: 120 * 1024 * 1024 } });

const FREE_MAX_FILES=1, FREE_MAX_FILE_MB=10;
const PRO_MAX_FILES=50, PRO_MAX_FILE_MB=100, PRO_MAX_TOTAL_MB=500;

const isProFromCookie = req => {
  const t = req.cookies?.pro_access;
  return t && validTokens.has(t);
};

app.get('/me', (req,res)=>res.json({ pro: isProFromCookie(req) }));

app.get('/unlock', (req,res)=>{
  const token = (req.query.token||'').toString();
  const ok = validTokens.has(token);
  if (ok) {
    res.cookie('pro_access', token, {
      httpOnly:true, sameSite:'Lax', secure:true,
      maxAge: 1000*60*60*24*730
    });
  }
  res.json({ ok });
});

app.post('/process', upload.array('files'), async (req,res)=>{
  const w = parseInt(req.body.w,10);
  const h = parseInt(req.body.h,10);
  const requestedFmt = (req.body.fmt||'jpeg').toLowerCase();
  const q = Math.round((parseFloat(req.body.q)||0.85)*100);
  const keep = req.body.keepAspect === '1';
  const targetSize = parseInt(req.body.targetSize, 10);
  const targetSizeUnit = req.body.targetSizeUnit || 'KB';
  const files = req.files||[];
  if (!files.length) return res.status(400).send('No files');

  const pro = isProFromCookie(req);
  const maxFiles = pro ? PRO_MAX_FILES : FREE_MAX_FILES;
  if (files.length > maxFiles) return res.status(400).send('Too many files');

  const perFileMB = pro ? PRO_MAX_FILE_MB : FREE_MAX_FILE_MB;
  const perFileBytes = perFileMB * 1024 * 1024;
  let totalBytes = 0;
  for (const f of files) {
    if (f.size > perFileBytes) return res.status(400).send(`File too large. Max ${perFileMB} MB per file.`);
    totalBytes += f.size;
  }
  if (pro && totalBytes/(1024*1024) > PRO_MAX_TOTAL_MB) {
    return res.status(400).send(`Batch too large. Max total ${PRO_MAX_TOTAL_MB} MB per request.`);
  }

  async function processOne(buf){
    let img = sharp(buf, { failOn: false }).rotate();
    let outFmt = requestedFmt;
    try {
      const meta = await img.metadata();
      const inFmt = (meta.format||'').toLowerCase();
      if (inFmt==='heic'||inFmt==='heif') outFmt='jpeg';
    } catch {}
    if (keep) img = img.resize(w,h,{ fit:'inside', withoutEnlargement:false });
    else img = img.resize(w,h,{ fit:'cover', position:'centre', background: req.body.backgroundColor || '#ffffff' });

    if (outFmt === 'original') {
      return buf;
    }

    let quality = q;
    if (targetSize && (outFmt === 'jpeg' || outFmt === 'webp')) {
      const targetBytes = targetSize * (targetSizeUnit === 'MB' ? 1024 * 1024 : 1024);
      let minQuality = 1;
      let maxQuality = 100;
      let currentQuality = quality;
      let outputBuffer;

      for (let i = 0; i < 10; i++) {
        if (outFmt === 'jpeg') {
          outputBuffer = await img.jpeg({ quality: currentQuality, mozjpeg: true }).toBuffer();
        } else {
          outputBuffer = await img.webp({ quality: currentQuality }).toBuffer();
        }

        if (outputBuffer.length <= targetBytes) {
          minQuality = currentQuality;
        } else {
          maxQuality = currentQuality;
        }
        currentQuality = Math.round((minQuality + maxQuality) / 2);
        if (maxQuality - minQuality < 2) {
          break;
        }
      }
      return outputBuffer;
    }

    if (outFmt==='png') return await img.png({ compressionLevel:9 }).toBuffer();
    if (outFmt==='webp') return await img.webp({ quality }).toBuffer();
    return await img.jpeg({ quality, mozjpeg:true }).toBuffer();
  }

  if (files.length===1){
    try{
      const out = await processOne(files[0].buffer);
      const media = requestedFmt==='png' ? 'image/png' : 'image/jpeg';
      res.setHeader('Content-Type', media);
      res.setHeader('Content-Disposition','attachment; filename="resized.'+(requestedFmt==='png'?'png':'jpg')+'"');
      return res.send(out);
    } catch { return res.status(500).send('Processing failed'); }
  }

  res.setHeader('Content-Type','application/zip');
  res.setHeader('Content-Disposition','attachment; filename="resized.zip"');
  const archive = archiver('zip',{ zlib:{ level:9 } });
  archive.pipe(res);
  for (const f of files){
    const out = await processOne(f.buffer);
    const name = f.originalname.replace(/\.[^.]+$/,'');
    archive.append(out,{ name:`${name}_${w}x${h}.${requestedFmt}` });
  }
  archive.finalize();
});

app.get('/socialPresets.json', (_req, res) => {
  res.sendFile(path.join(__dirname, 'socialPresets.json'));
});

app.post('/process-crop', upload.single('file'), async (req, res) => {
  const { cropData } = req.body;
  const { x, y, width, height } = JSON.parse(cropData);

  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const outputBuffer = await sharp(req.file.buffer)
      .extract({ left: x, top: y, width, height })
      .toBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="cropped.png"');
    res.send(outputBuffer);
  } catch (error) {
    res.status(500).send('Processing failed');
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    try {
        const metadata = await sharp(req.file.buffer).metadata();
        res.json({
            success: true,
            file: {
                name: req.file.originalname,
                size: req.file.size,
                width: metadata.width,
                height: metadata.height,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Could not read image dimensions.' });
    }
});

app.post('/api/transform', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    try {
        const { w, h, fmt, q, keepAspect, backgroundColor } = req.body;
        const width = parseInt(w, 10);
        const height = parseInt(h, 10);
        const quality = Math.round((parseFloat(q) || 0.85) * 100);
        const keep = keepAspect === '1';

        let img = sharp(req.file.buffer).rotate();
        
        if (keep) {
            img = img.resize(width, height, { fit: 'inside', withoutEnlargement: false });
        } else {
            img = img.resize(width, height, { fit: 'cover', position: 'centre', background: backgroundColor || '#ffffff' });
        }

        let outputBuffer;
        const format = fmt || 'jpeg';

        if (format === 'png') {
            outputBuffer = await img.png({ compressionLevel: 9 }).toBuffer();
        } else if (format === 'webp') {
            outputBuffer = await img.webp({ quality }).toBuffer();
        } else {
            outputBuffer = await img.jpeg({ quality, mozjpeg: true }).toBuffer();
        }
        
        res.setHeader('Content-Type', `image/${format}`);
        res.setHeader('Content-Disposition', `attachment; filename="transformed.${format}"`);
        res.send(outputBuffer);

    } catch (error) {
        res.status(500).json({ success: false, error: 'Image transformation failed.' });
    }
});

app.get('/', (_req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.get('*', (_req,res)=>res.status(404).send('Not found'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Listening on ${PORT}`));
