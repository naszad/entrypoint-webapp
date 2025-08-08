import { NextResponse } from 'next/server';
import { getAllTagCategories, getAllTagsForCustomer } from '@/libs/tagsService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    
    if (type === 'categories') {
      const categories = await getAllTagCategories();
      return NextResponse.json(categories);
    } else {
      const tags = await getAllTagsForCustomer();
      return NextResponse.json(tags);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred while fetching tags';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}