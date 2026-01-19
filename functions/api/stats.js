// Cloudflare Pages Function - 통계 API
export async function onRequest(context) {
  const { request, env } = context;
  const db = env['milkt-db'];
  
  // CORS 헤더
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method Not Allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // 각 상태별 개수 조회
    const totalResult = await db.prepare('SELECT COUNT(*) as count FROM inquiries').first();
    const pendingResult = await db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'pending'").first();
    const contactedResult = await db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'contacted'").first();
    const completedResult = await db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'completed'").first();
    const cancelledResult = await db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'cancelled'").first();

    const stats = {
      total: parseInt(totalResult?.count || 0),
      pending: parseInt(pendingResult?.count || 0),
      contacted: parseInt(contactedResult?.count || 0),
      completed: parseInt(completedResult?.count || 0),
      cancelled: parseInt(cancelledResult?.count || 0)
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: stats
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Stats API Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        data: {
          total: 0,
          pending: 0,
          contacted: 0,
          completed: 0,
          cancelled: 0
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
