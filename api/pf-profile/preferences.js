import { ensureUser, snapshot } from '../_lib/store.js';
import { S_DOMAIN, S_TOKEN, getOrdersByEmail } from '../_lib/shopify.js';

export default async function handler(req,res){
  try{
    const body = await readJson(req);
    const email = (body.email||'hello@provitafit.com').toLowerCase();
    const u = ensureUser(email);

    if (body.consent){ u.consent.email=!!body.consent.email; u.consent.sms=!!body.consent.sms; }
    if (body.topics){
      u.topics = {
        tips_energie: !!body.topics.tips_energie,
        aanbiedingen: !!body.topics.aanbiedingen,
        never_quit_stories: !!body.topics.never_quit_stories
      };
    }

    let orders = [];
    try{ if (S_DOMAIN && S_TOKEN) orders = await getOrdersByEmail(email, 20); }catch(_){}
    res.status(200).json(snapshot(u, orders));
  }catch(e){ res.status(500).json({error:'Server error', message:String(e?.message||e)})}
}
async function readJson(req){ const chunks=[]; for await (const c of req) chunks.push(c); return JSON.parse(Buffer.concat(chunks).toString()||'{}'); }
