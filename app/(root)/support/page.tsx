/**
 * Support ticket page
 * Allows users to create support tickets - admins handle everything else
 */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

const ticketSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    category: z.string(),
    priority: z.string(),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export default function SupportPage() {
    const form = useForm<TicketFormData>({
        resolver: zodResolver(ticketSchema),
        defaultValues: {
            subject: "",
            category: "general",
            priority: "medium",
            message: "",
        },
    });

    const sendAdminMessageMutation = trpc.user.sendAdminMessage.useMutation({
        onSuccess: (data) => {
            if (data.method === 'push') {
                toast.success("Admins notified instantly via push notification! We'll be in touch.");
            } else {
                toast.success("Support ticket created. Our team will get back to you soon.");
            }
            form.reset();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to send message");
        },
    });

    const onSubmit = (data: TicketFormData) => {
        // Format message to include category and priority
        const fullMessage = `[${data.category.toUpperCase()}] [${data.priority.toUpperCase()}]\n\n${data.message}`;

        sendAdminMessageMutation.mutate({
            subject: data.subject,
            message: fullMessage,
        });
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-3xl">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <MessageSquare className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle className="text-2xl">Contact Support</CardTitle>
                            <CardDescription>
                                Send a message directly to our admin team. We'll be notified instantly.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="subject"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Subject</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Brief description of your issue" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="general">General</SelectItem>
                                                    <SelectItem value="technical">Technical Issue</SelectItem>
                                                    <SelectItem value="billing">Billing</SelectItem>
                                                    <SelectItem value="feature">Feature Request</SelectItem>
                                                    <SelectItem value="bug">Bug Report</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Priority</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select priority" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Message</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe your issue in detail..."
                                                className="min-h-[200px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={sendAdminMessageMutation.isPending}
                                size="lg"
                            >
                                {sendAdminMessageMutation.isPending ? "Sending..." : "Send Message"}
                            </Button>
                        </form>
                    </Form>

                    <div className="mt-6 p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            <strong>Note:</strong> Admins with push notifications enabled will receive this immediately.
                            Otherwise, a support ticket will be created automatically.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
