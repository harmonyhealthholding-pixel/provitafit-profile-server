const g = globalThis;
g.__PF_STORE__ = g.__PF_STORE__ || {};
export const store = g.__PF_STORE__;

export const LOYALTY_CONFIG = {
  points_per_euro: 25, points_per_profile_field: 100, points_per_visit: 5, points_per_click: 1,
  points_per_quiz: 200, points_per_referral: 500, points_per_review: 150, points_per_share: 50,
  multipliers: { weekend_bonus: 1.5, streak_bonus: 1.2 }, 
  rewards: { 
    1000:{type:'coupon',value:'5%',code:'PF-5OFF'}, 
    2500:{type:'coupon',value:'10%',code:'PF-10OFF'}, 
    5000:{type:'free_shipping',value:'Gratis verzending'}, 
    10000:{type:'coupon',value:'15%',code:'PF-15OFF'} 
  }
};

const nowISO = ()=> new Date().toISOString();

export function ensureUser(email){
  if(!store[email]){
    store[email] = {
      core:{ email, first_name:'Robin', last_name:'H' },
      consent:{ email:true, sms:false },
      topics:{ tips_energie:true, aanbiedingen:true, never_quit_stories:false },
      loyalty:{ total:12450, history:[], awardedFields:[], earned_rewards:[], last_visit:new Date().toDateString() },
      coupons:{ active:[{code:'PF-NEW10',value:'10%',expires_at:'2025-12-31'}], used:[{code:'PF-REF10-ABCD',used_at:'2025-10-15'}] },
      referral:{ link:'https://pf.fit/r/abcd1234', count:3, rewards:2, discountTotal:20 },
      quiz:{ version:'v1.2', last_taken_at:'2025-10-21T10:00:00Z', recommendation:{bundle_handle:'energy-start-bundle', products:['gentlemag-go','b-complex','vit-d3-k2']} }
    };
  }
  return store[email];
}

function getMultiplier(user){
  let m = 1; const d = new Date();
  if ([0,6].includes(d.getDay())) m *= LOYALTY_CONFIG.multipliers.weekend_bonus;
  const today = d.toDateString(); 
  if (user.loyalty.last_visit === today) m *= LOYALTY_CONFIG.multipliers.streak_bonus;
  user.loyalty.last_visit = today; 
  return m;
}

export function awardPoints(user, type, value=1, meta={}){
  const base = LOYALTY_CONFIG[`points_per_${type}`] || 0;
  const mult = getMultiplier(user);
  const pts = Math.round(base * value * mult);
  user.loyalty.total += pts;
  user.loyalty.history.unshift({ ts: nowISO(), type:`earn_${type}`, value:pts, multiplier:mult, metadata:meta });
  
  const earned = user.loyalty.earned_rewards || [];
  Object.entries(LOYALTY_CONFIG.rewards).forEach(([th, r])=>{
    const n = +th; 
    if (user.loyalty.total>=n && !earned.includes(n)){
      earned.push(n);
      if (r.type==='coupon') user.coupons.active.push({ code:r.code, value:r.value, expires_at: nowISO().slice(0,10) });
    }
  });
  user.loyalty.earned_rewards = earned;
  return pts;
}

export function snapshot(u, orders){
  return {
    profile:{
      email:u.core.email, first_name:u.core.first_name, last_name:u.core.last_name,
      properties:{
        loyalty_points_total:u.loyalty.total, topics:u.topics, consent:u.consent,
        quiz_version:u.quiz.version, quiz_last_taken_at:u.quiz.last_taken_at, quiz_recommendation:u.quiz.recommendation,
        referral_link:u.referral.link, referrals_count:u.referral.count, referral_rewards_earned:u.referral.rewards,
        referral_discounts_total:u.referral.discountTotal, active_coupons:u.coupons.active, used_coupons:u.coupons.used
      }
    },
    orders,
    loyalty:{ total:u.loyalty.total, history:u.loyalty.history }
  };
}
