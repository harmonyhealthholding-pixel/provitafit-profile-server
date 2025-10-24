import { ensureUser, snapshot } from '../_lib/store.js';
import { S_DOMAIN, S_TOKEN, getOrdersByEmail } from '../_lib/shopify.js';

export default async function handler(req,res){
  try{
    const url = new URL(req.url, `http://${req.headers.host}`);
    const email = (url.searchParams.get('email')||'hello@provitafit.com').toLowerCase();
    const u = ensureUser(email);

    let orders = [];
    try{ if (S_DOMAIN && S_TOKEN) orders = await getOrdersByEmail(email, 20); }catch(_){}
    res.status(200).json(snapshot(u, orders));
  }catch(e){ res.status(500).json({error:'Server error', message:String(e?.message||e)})}
}
