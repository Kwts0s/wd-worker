import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/db';

/**
 * GET endpoint to retrieve all products from SQLite database
 */
export async function GET() {
  try {
    const products = getAllProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Failed to retrieve products:', error);
    return NextResponse.json({ error: 'Failed to retrieve products' }, { status: 500 });
  }
}
