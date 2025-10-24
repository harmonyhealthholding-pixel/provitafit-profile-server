export const S_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
export const S_TOKEN  = process.env.SHOPIFY_ADMIN_TOKEN;
export const S_VER    = process.env.SHOPIFY_API_VERSION || '2024-10';

export async function shopifyAdminGraphQL(query, variables) {
  if (!S_DOMAIN || !S_TOKEN) throw new Error('Shopify Admin creds ontbreken');
  const r = await fetch(`https://${S_DOMAIN}/admin/api/${S_VER}/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': S_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  if (!r.ok) throw new Error('Shopify Admin API error');
  return r.json();
}

export async function getOrdersByEmail(email, first = 20) {
  const q = `
    query OrdersByEmail($query:String!, $first:Int!){
      orders(first:$first, query:$query, sortKey:CREATED_AT, reverse:true){
        edges{ node{
          id orderNumber processedAt displayFinancialStatus statusUrl
          currentSubtotalPriceSet{ shopMoney{ amount currencyCode } }
        } }
      }
    }`;
  const data = await shopifyAdminGraphQL(q, { query: `email:${email}`, first });
  const edges = data?.data?.orders?.edges || [];
  return edges.map(({node})=>({
    id: node.id,
    number: `#${node.orderNumber}`,
    date: new Date(node.processedAt).toISOString().slice(0,10),
    status: node.displayFinancialStatus || '—',
    total: new Intl.NumberFormat('nl-NL',{style:'currency',currency:node.currentSubtotalPriceSet.shopMoney.currencyCode})
      .format(Number(node.currentSubtotalPriceSet.shopMoney.amount)),
    url: node.statusUrl
  }));
}
