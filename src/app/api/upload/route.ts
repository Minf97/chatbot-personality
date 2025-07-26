import { NextRequest, NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { table, data } = await request.json();

    if (!table || !data) {
      return NextResponse.json({ error: 'Table and data are required' }, { status: 400 });
    }

    console.log('Uploading data to table:', table, 'with data:', data);

    // Handle agents table
    if (table === 'agents') {
      // Insert agent data with the specified format: { email: email, bg: summary, name: name }
      const { email, bg, name, created_at } = data;
      
      const query = `
        INSERT INTO agents (email, bg, name, created_at)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const values = [email, bg, name, created_at];
      const result = await queryDB(query, values);
      
      return NextResponse.json({
        success: true,
        data: result.rows[0],
        message: 'Agent data uploaded successfully'
      });
      
    } else {
      return NextResponse.json({ error: 'Unsupported table type' }, { status: 400 });
    }

  } catch (error) {
    console.error('Database upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload data to database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}