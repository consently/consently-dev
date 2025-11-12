import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Tag, ArrowLeft, Share2, BookOpen, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featured_image: string | null;
  author_name: string;
  author_email: string;
  published_at: string;
  reading_time: number;
  views: number;
  meta_title?: string;
  meta_description?: string;
}

async function getBlogPost(slug: string) {
  try {
    const supabase = await createClient();
    
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error) {
      console.error('Error fetching blog post:', error);
      return null;
    }

    if (!post) {
      console.log(`Blog post with slug "${slug}" not found`);
      return null;
    }

    // Ensure tags is an array and normalize post data
    const normalizedPost = {
      ...post,
      tags: Array.isArray(post.tags) ? post.tags : (post.tags ? [post.tags] : []),
      title: post.title || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || 'Uncategorized',
      author_name: post.author_name || 'Unknown',
      author_email: post.author_email || '',
      reading_time: post.reading_time || 5,
      views: post.views || 0,
    };

    // Get related posts
    const { data: relatedPosts, error: relatedError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, featured_image, published_at, category, tags, author_name, author_email, reading_time, views')
      .eq('published', true)
      .eq('category', normalizedPost.category)
      .neq('id', normalizedPost.id)
      .order('published_at', { ascending: false })
      .limit(3);

    if (relatedError) {
      console.error('Error fetching related posts:', relatedError);
    }

    // Normalize related posts
    const normalizedRelatedPosts = (relatedPosts || []).map((rp: any) => ({
      ...rp,
      tags: Array.isArray(rp.tags) ? rp.tags : (rp.tags ? [rp.tags] : []),
      title: rp.title || '',
      excerpt: rp.excerpt || '',
      category: rp.category || 'Uncategorized',
      author_name: rp.author_name || 'Unknown',
    }));

    return {
      post: normalizedPost,
      relatedPosts: normalizedRelatedPosts,
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBlogPost(slug);

  if (!data || !data.post) {
    return {
      title: 'Blog Post Not Found',
    };
  }

  const post = data.post;

  return {
    title: post.meta_title || post.title || 'Blog Post',
    description: post.meta_description || post.excerpt || '',
    ...(Array.isArray(post.tags) && post.tags.length > 0 && { keywords: post.tags }),
    ...(post.author_name && { authors: [{ name: post.author_name }] }),
    openGraph: {
      title: post.title || 'Blog Post',
      description: post.excerpt || '',
      type: 'article',
      ...(post.published_at && { publishedTime: post.published_at }),
      ...(post.author_name && { authors: [post.author_name] }),
      ...(Array.isArray(post.tags) && post.tags.length > 0 && { tags: post.tags }),
      ...(post.featured_image && { images: [post.featured_image] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title || 'Blog Post',
      description: post.excerpt || '',
      ...(post.featured_image && { images: [post.featured_image] }),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getBlogPost(slug);

  if (!data || !data.post) {
    notFound();
  }

  const { post, relatedPosts } = data;

  // Safely create JSON-LD with error handling
  let jsonLdString = '';
  try {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title || '',
      description: post.excerpt || '',
      ...(post.featured_image && { image: post.featured_image }),
      ...(post.published_at && { datePublished: post.published_at }),
      ...(post.published_at && { dateModified: post.published_at }),
      author: {
        '@type': 'Person',
        name: post.author_name || 'Unknown',
        ...(post.author_email && { email: post.author_email }),
      },
      publisher: {
        '@type': 'Organization',
        name: 'Consently',
        url: 'https://www.consently.in',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://www.consently.in/blog/${post.slug}`,
      },
      ...(Array.isArray(post.tags) && post.tags.length > 0 && { keywords: post.tags.join(', ') }),
      ...(post.category && { articleSection: post.category }),
    };
    jsonLdString = JSON.stringify(jsonLd);
  } catch (error) {
    console.error('Error creating JSON-LD:', error);
    // If JSON serialization fails, just skip it
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {jsonLdString && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString }}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Button */}
        <Link href="/blog">
          <Button variant="ghost" className="mb-6 sm:mb-8 group hover:bg-white/80">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Button>
        </Link>

        <article className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50 backdrop-blur-sm">
          {/* Featured Image */}
          {post.featured_image && (
            <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 overflow-hidden">
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              />
            </div>
          )}

          <div className="p-6 sm:p-8 md:p-12 lg:p-16 bg-gradient-to-b from-white to-gray-50/50">
            {/* Header */}
            <header className="mb-10 md:mb-14 pb-8 border-b border-gray-200/60">
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <Badge variant="secondary" className="text-sm px-4 py-1.5 font-semibold bg-blue-100 text-blue-700 border-0">
                  {post.category}
                </Badge>
                {Array.isArray(post.tags) && post.tags.length > 0 && post.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs px-3 py-1 border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-colors">
                    <Tag className="h-3 w-3 mr-1.5" />
                    {tag}
                  </Badge>
                ))}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed font-medium max-w-3xl">
                  {post.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-600 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-full">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium">{post.author_name || 'Unknown Author'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-50 rounded-full">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <span>
                    {post.published_at ? new Date(post.published_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : 'Date not available'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-50 rounded-full">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <span>{post.reading_time || 5} min read</span>
                </div>
              </div>
            </header>

            {/* Content */}
            <div
              className="blog-content bg-white rounded-xl p-6 sm:p-8 md:p-10 shadow-inner border border-gray-100"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Share Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-gray-500" />
                  <span className="font-semibold text-gray-700">Share this article</span>
                </div>
                <div className="flex gap-3">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://www.consently.in/blog/${post.slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 h-10 px-4 border border-gray-300 bg-white text-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-md"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                    Twitter
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://www.consently.in/blog/${post.slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 h-10 px-4 border border-gray-300 bg-white text-gray-700 hover:bg-blue-700 hover:text-white hover:border-blue-700 hover:shadow-md"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-3 mb-8">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Related Articles</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost: BlogPost) => (
                <Card key={relatedPost.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
                  {relatedPost.featured_image && (
                    <div className="relative w-full h-48 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 overflow-hidden">
                      <Image
                        src={relatedPost.featured_image}
                        alt={relatedPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {relatedPost.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg sm:text-xl mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      <Link href={`/blog/${relatedPost.slug}`}>
                        {relatedPost.title}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {relatedPost.excerpt}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {relatedPost.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(relatedPost.published_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {relatedPost.reading_time || 5} min
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

