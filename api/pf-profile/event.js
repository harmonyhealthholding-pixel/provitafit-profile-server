import { ensureUser, awardPoints } from '../_lib/store.js';

export default async function handler(req,res){
  try{
    const body = await readJson(req);
    const email = (body.email||'hello@provitafit.com').toLowerCase();
    const u = ensureUser(email);
    const ev = String(body.event||'');

    if (ev==='website_visit') awardPoints(u,'visit',1,{ page: body.page });
    if (ev==='quiz_completed') awardPoints(u,'quiz',1,{ version: body.version });
    if (ev==='click') awardPoints(u,'click',1,{ element: body.element, page: body.page, timestamp: body.timestamp });

    res.json({ ok:true });
  }catch(e){ res.status(500).json({error:'Server error', message:String(e?.message||e)})}
}
async function readJson(req){ const chunks=[]; for await (const c of req) chunks.push(c); return JSON.parse(Buffer.concat(chunks).toString()||'{}'); }
