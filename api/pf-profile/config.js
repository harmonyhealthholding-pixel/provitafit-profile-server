import { LOYALTY_CONFIG } from '../_lib/store.js';
export default async function handler(req,res){ res.json({ loyalty:LOYALTY_CONFIG, timestamp:new Date().toISOString() }); }
