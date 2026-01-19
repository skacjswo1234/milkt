// Cloudflare Pages Function - 문의 API
export async function onRequest(context) {
  const { request, env } = context;
  const db = env['milkt-db'];
  
  // CORS 헤더
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    // GET /api/inquiries - 문의 목록 조회
    if (method === 'GET' && path === '/api/inquiries') {
      const status = url.searchParams.get('status') || 'all';
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM inquiries';
      let params = [];

      if (status !== 'all') {
        query += ' WHERE status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const { results } = await db.prepare(query).bind(...params).all();

      // 전체 개수 조회
      let countQuery = 'SELECT COUNT(*) as total FROM inquiries';
      let countParams = [];
      if (status !== 'all') {
        countQuery += ' WHERE status = ?';
        countParams.push(status);
      }
      const { results: countResults } = await db.prepare(countQuery).bind(...countParams).first();

      return new Response(
        JSON.stringify({
          success: true,
          data: results,
          pagination: {
            page,
            limit,
            total: countResults?.total || 0,
            totalPages: Math.ceil((countResults?.total || 0) / limit),
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // GET /api/inquiries/:id - 특정 문의 조회
    if (method === 'GET' && path.match(/^\/api\/inquiries\/\d+$/)) {
      const id = path.split('/').pop();
      const result = await db.prepare('SELECT * FROM inquiries WHERE id = ?').bind(id).first();

      if (!result) {
        return new Response(
          JSON.stringify({ success: false, error: '문의를 찾을 수 없습니다.' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: result }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // POST /api/inquiries - 새 문의 생성
    if (method === 'POST' && path === '/api/inquiries') {
      const body = await request.json();
      const { child_birthday, parent_name, phone_number, agree1, agree2, agree3 } = body;

      if (!child_birthday || !parent_name || !phone_number) {
        return new Response(
          JSON.stringify({ success: false, error: '필수 항목이 누락되었습니다.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { success, meta } = await db
        .prepare(
          'INSERT INTO inquiries (child_birthday, parent_name, phone_number, agree1, agree2, agree3) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .bind(child_birthday, parent_name, phone_number, agree1 ? 1 : 0, agree2 ? 1 : 0, agree3 ? 1 : 0)
        .run();

      if (success) {
        const result = await db.prepare('SELECT * FROM inquiries WHERE id = ?').bind(meta.last_row_id).first();
        return new Response(
          JSON.stringify({ success: true, data: result }),
          {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: '문의 생성에 실패했습니다.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // PUT /api/inquiries/:id - 문의 수정
    if (method === 'PUT' && path.match(/^\/api\/inquiries\/\d+$/)) {
      const id = path.split('/').pop();
      const body = await request.json();
      const { status, notes } = body;

      const updateFields = [];
      const updateValues = [];

      if (status) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      if (notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(notes);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id);

      if (updateFields.length === 1) {
        return new Response(
          JSON.stringify({ success: false, error: '수정할 항목이 없습니다.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const query = `UPDATE inquiries SET ${updateFields.join(', ')} WHERE id = ?`;
      const { success } = await db.prepare(query).bind(...updateValues).run();

      if (success) {
        const result = await db.prepare('SELECT * FROM inquiries WHERE id = ?').bind(id).first();
        return new Response(
          JSON.stringify({ success: true, data: result }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: '문의 수정에 실패했습니다.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // DELETE /api/inquiries/:id - 문의 삭제
    if (method === 'DELETE' && path.match(/^\/api\/inquiries\/\d+$/)) {
      const id = path.split('/').pop();
      const { success } = await db.prepare('DELETE FROM inquiries WHERE id = ?').bind(id).run();

      if (success) {
        return new Response(
          JSON.stringify({ success: true, message: '문의가 삭제되었습니다.' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: '문의 삭제에 실패했습니다.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // GET /api/stats - 통계 정보
    if (method === 'GET' && path === '/api/stats') {
      const stats = await db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM inquiries
      `).first();

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            total: stats?.total || 0,
            pending: stats?.pending || 0,
            contacted: stats?.contacted || 0,
            completed: stats?.completed || 0,
            cancelled: stats?.cancelled || 0
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Not Found' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
