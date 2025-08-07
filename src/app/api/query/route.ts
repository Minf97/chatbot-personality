import { NextRequest, NextResponse } from 'next/server';
import { queryDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { query, params } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const result = await queryDB(query, params);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      rowCount: result.rowCount
    });
    
  } catch (error) {
    console.error('Query API error:', error);
    return NextResponse.json(
      { error: 'Database query failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await queryDB('SELECT NOW() as current_time');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: result.rows
    });
    
  } catch (error) {
    console.error('Database connection test error:', error);
    return NextResponse.json(
      { error: 'Database connection failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}