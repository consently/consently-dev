import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight, Tag, BookOpen } from 'lucide-react';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Blog - DPDPA Compliance & Privacy Insights',
  description: 'Stay updated with the latest insights on DPDPA 2023 compliance, data protection, privacy regulations, and consent management best practices for Indian businesses.',
  keywords: [
    'DPDPA 2023',
    'data protection blog',
    'privacy compliance',
    'consent management',
    'GDPR vs DPDPA',
    'data privacy India',
    'cookie consent',
    'privacy regulations',
  ],
  openGraph: {
    title: 'Blog - Consently',
    description: 'DPDPA 2023 compliance insights and privacy best practices',
    type: 'website',
  },
};

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
}

async function getBlogPosts(page: number = 1, limit: number = 12) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/blog?page=${page}&limit=${limit}`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      return { posts: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return { posts: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
  }
}

async function getCategories() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/blog/categories`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return { categories: [] };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { categories: [] };
  }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string; category?: string; tag?: string; search?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const { posts, pagination } = await getBlogPosts(page);
  const { categories } = await getCategories();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Consently Blog',
    description: 'DPDPA 2023 compliance insights and privacy best practices',
    url: 'https://www.consently.in/blog',
    publisher: {
      '@type': 'Organization',
      name: 'Consently',
      url: 'https://www.consently.in',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <BookOpen className="h-8 w-8" />
              <h1 className="text-4xl md:text-5xl font-bold">Consently Blog</h1>
            </div>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mt-4">
              Expert insights on DPDPA 2023 compliance, data protection, and privacy best practices
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categories.map((cat: { name: string; count: number }) => (
                    <Link
                      key={cat.name}
                      href={`/blog?category=${encodeURIComponent(cat.name)}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-sm font-medium">{cat.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {cat.count}
                      </Badge>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Blog Posts Yet</h3>
                  <p className="text-gray-600">Check back soon for insightful articles on DPDPA compliance!</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {posts.map((post: BlogPost) => (
                    <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {post.featured_image && (
                        <div className="aspect-video w-full bg-gradient-to-br from-blue-100 to-purple-100 relative overflow-hidden">
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="secondary">{post.category}</Badge>
                          {post.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <CardTitle className="text-xl mb-2">
                          <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                            {post.title}
                          </Link>
                        </CardTitle>
                        <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(post.published_at).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {post.reading_time || 5} min read
                            </span>
                          </div>
                        </div>
                        <Link href={`/blog/${post.slug}`}>
                          <Button variant="outline" className="w-full">
                            Read More
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <Link key={pageNum} href={`/blog?page=${pageNum}`}>
                        <Button
                          variant={pageNum === page ? 'default' : 'outline'}
                          size="sm"
                        >
                          {pageNum}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

