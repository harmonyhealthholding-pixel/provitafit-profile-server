import { ensureUser, awardPoints, snapshot } from '../_lib/store.js';
import { S_DOMAIN, S_TOKEN, getOrdersByEmail } from '../_lib/shopify.js';

export default async function handler(req,res){
  try{
    const body = await readJson(req);
    const email = (body.email||'hello@provitafit.com').toLowerCase();
    const u = ensureUser(email);
    const before = { ...u.core };

    const patch = pick(body,['first_name','last_name','email','phone','phone_code','address']);
    u.core = { ...u.core, ...patch };
    const awardMap = { first_name:'first_name', last_name:'last_name', phone:'phone_number', address:'address' };
    Object.entries(awardMap).forEach(([k, field])=>{
      const wasEmpty = !before[k]; const isFilled = !!u.core[k];
      const notAwarded = !(u.loyalty.awardedFields||[]).includes(field);
      if (wasEmpty && isFilled && notAwarded){ awardPoints(u,'profile_field',1,{field}); (u.loyalty.awardedFields ||= []).push(field); }
    });

    let orders = [];
    try{ if (S_DOMAIN && S_TOKEN) orders = await getOrdersByEmail(u.core.email, 20); }catch(_){}
    res.status(200).json(snapshot(u, orders));
  }catch(e){ res.status(500).json({error:'Server error', message:String(e?.message||e)})}
}

function pick(o,keys){ const r={}; keys.forEach(k=>{ if(o?.[k]!==undefined) r[k]=o[k] }); return r; }
async function readJson(req){ const chunks=[]; for await (const c of req) chunks.push(c); return JSON.parse(Buffer.concat(chunks).toString()||'{}'); }
