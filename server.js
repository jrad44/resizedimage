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
    else img = img.resize(w,h,{ fit:'cover', position:'centre' });
    if (outFmt==='png') return await img.png({ compressionLevel:9 }).toBuffer();
    return await img.jpeg({ quality:q, mozjpeg:true }).toBuffer();
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
    archive.append(out,{ name:`${name}_${w}x${h}.jpg` });
  }
  archive.finalize();
});

app.get('/', (_req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.get('*', (_req,res)=>res.status(404).send('Not found'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Listening on ${PORT}`));
