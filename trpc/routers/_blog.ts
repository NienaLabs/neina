import { z } from 'zod';
import { createTRPCRouter, baseProcedure, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';
import prisma from '@/lib/prisma';

// Helper to check admin role
const checkAdmin = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'admin') {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin access required' });
    }
    return user;
};

export const blogRouter = createTRPCRouter({
    // --- Public Procedures ---
    getPosts: baseProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(10),
                cursor: z.string().nullish(),
                category: z.enum(['GENERAL', 'DEVELOPERS', 'JOB_HUNT', 'CHANGELOGS', 'ALL']).optional().default('ALL'),
            })
        )
        .query(async ({ input }) => {
            const { limit, cursor, category } = input;

            const where: any = { published: true };
            if (category && category !== 'ALL') {
                where.category = category;
            }

            const posts = await prisma.blogPost.findMany({
                take: limit + 1,
                where,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    slug: true,
                    title: true,
                    excerpt: true,
                    coverImage: true,
                    authorName: true,
                    readTime: true,
                    category: true,
                    createdAt: true,
                }
            });

            let nextCursor: typeof cursor | undefined = undefined;
            if (posts.length > limit) {
                const nextItem = posts.pop();
                nextCursor = nextItem!.id;
            }

            return {
                posts,
                nextCursor,
            };
        }),

    getPostBySlug: baseProcedure
        .input(z.object({ slug: z.string() }))
        .query(async ({ input }) => {
            const post = await prisma.blogPost.findUnique({
                where: { slug: input.slug },
            });

            if (!post || (!post.published)) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Blog post not found' });
            }

            return post;
        }),

    // --- Admin Procedures ---
    getAdminPosts: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(20),
                cursor: z.string().nullish(),
                search: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            await checkAdmin(ctx.session.user.id);

            const { limit, cursor, search } = input;
            const where: any = {};

            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { content: { contains: search, mode: 'insensitive' } },
                ];
            }

            const posts = await prisma.blogPost.findMany({
                take: limit + 1,
                where,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { createdAt: 'desc' },
            });

            let nextCursor: typeof cursor | undefined = undefined;
            if (posts.length > limit) {
                const nextItem = posts.pop();
                nextCursor = nextItem!.id;
            }

            return {
                posts,
                nextCursor,
            };
        }),

    getAdminPostById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            await checkAdmin(ctx.session.user.id);
            const post = await prisma.blogPost.findUnique({ where: { id: input.id } });
            if (!post) throw new TRPCError({ code: 'NOT_FOUND' });
            return post;
        }),

    createPost: protectedProcedure
        .input(
            z.object({
                title: z.string(),
                slug: z.string(),
                content: z.string(),
                excerpt: z.string().optional(),
                coverImage: z.string().optional(),
                imagePosition: z.string().default('TOP'),
                published: z.boolean().default(false),
                authorName: z.string().default('Admin'),
                readTime: z.string().optional(),
                category: z.enum(['GENERAL', 'DEVELOPERS', 'JOB_HUNT', 'CHANGELOGS']).default('GENERAL'),
                metaTitle: z.string().optional(),
                metaDescription: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await checkAdmin(ctx.session.user.id);

            // Check if slug is unique
            const existing = await prisma.blogPost.findUnique({ where: { slug: input.slug } });
            if (existing) {
                throw new TRPCError({ code: 'CONFLICT', message: 'Slug already exists' });
            }

            return await prisma.blogPost.create({
                data: input
            });
        }),

    updatePost: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string().optional(),
                slug: z.string().optional(),
                content: z.string().optional(),
                excerpt: z.string().optional(),
                coverImage: z.string().optional(),
                imagePosition: z.string().optional(),
                published: z.boolean().optional(),
                authorName: z.string().optional(),
                readTime: z.string().optional(),
                category: z.enum(['GENERAL', 'DEVELOPERS', 'JOB_HUNT', 'CHANGELOGS']).optional(),
                metaTitle: z.string().optional(),
                metaDescription: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await checkAdmin(ctx.session.user.id);

            const { id, ...data } = input;

            if (data.slug) {
                const existing = await prisma.blogPost.findFirst({
                    where: {
                        slug: data.slug,
                        NOT: { id }
                    }
                });
                if (existing) {
                    throw new TRPCError({ code: 'CONFLICT', message: 'Slug already exists' });
                }
            }

            return await prisma.blogPost.update({
                where: { id },
                data,
            });
        }),

    deletePost: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await checkAdmin(ctx.session.user.id);
            return await prisma.blogPost.delete({ where: { id: input.id } });
        }),
});
