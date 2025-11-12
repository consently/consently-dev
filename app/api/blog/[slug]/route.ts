import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error) {
      console.error('Error fetching blog post:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Blog post not found', details: error.message },
        { status: 404 }
      );
    }

    if (!post) {
      console.log(`Blog post with slug "${slug}" not found`);
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Ensure tags is an array
    if (!Array.isArray(post.tags)) {
      post.tags = post.tags || [];
    }

    // Get related posts
    const { data: relatedPosts, error: relatedError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, featured_image, published_at')
      .eq('published', true)
      .eq('category', post.category)
      .neq('id', post.id)
      .order('published_at', { ascending: false })
      .limit(3);

    if (relatedError) {
      console.error('Error fetching related posts:', relatedError);
    }

    return NextResponse.json({
      post,
      relatedPosts: relatedPosts || [],
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

