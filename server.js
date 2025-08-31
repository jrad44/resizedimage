import express from 'express';
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


app.get('/', (_req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.get('*', (_req,res)=>res.status(404).send('Not found'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Listening on ${PORT}`));
