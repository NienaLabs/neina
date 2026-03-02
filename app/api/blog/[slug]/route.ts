import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const post = await prisma.blog_post.findUnique({
            where: { slug },
        });

        if (!post || !post.published) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error('Error fetching blog post:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
