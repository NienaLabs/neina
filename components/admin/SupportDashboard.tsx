"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function SupportDashboard() {
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyMessage, setReplyMessage] = useState("");

    const { data: tickets, isLoading } = trpc.admin.getSupportTickets.useQuery({});
    const { data: ticketDetails } = trpc.admin.getTicketDetails.useQuery(
        { ticketId: selectedTicketId! },
        { enabled: !!selectedTicketId }
    );

    const replyMutation = trpc.admin.replyToTicket.useMutation({
        onSuccess: () => {
            setReplyMessage("");
            // Invalidate queries or update optimistic UI here
        },
    });

    const handleReply = () => {
        if (!selectedTicketId || !replyMessage.trim()) return;
        replyMutation.mutate({ ticketId: selectedTicketId, message: replyMessage });
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Recent Tickets</CardTitle>
                    <CardDescription>
                        Overview of pending support requests.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : tickets?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">No tickets found.</TableCell>
                                </TableRow>
                            ) : (
                                tickets?.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium">{ticket.subject}</TableCell>
                                        <TableCell>{ticket.user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={ticket.status === 'open' ? 'destructive' : 'secondary'}>
                                                {ticket.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{format(new Date(ticket.createdAt), "MMM d")}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="ghost" onClick={() => setSelectedTicketId(ticket.id)}>
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="col-span-3">
                {/* Ticket Details View */}
                {selectedTicketId && ticketDetails ? (
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg">{ticketDetails.subject}</CardTitle>
                            <CardDescription>From: {ticketDetails.user.name} ({ticketDetails.user.email})</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                {ticketDetails.messages.map((msg) => (
                                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            <p className="text-sm">{msg.message}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(msg.createdAt), "h:mm a")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4 border-t">
                                <Textarea
                                    placeholder="Type your reply..."
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    className="mb-2"
                                />
                                <Button onClick={handleReply} disabled={replyMutation.isPending} className="w-full">
                                    {replyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send Reply
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="h-full flex items-center justify-center p-6 text-muted-foreground">
                        Select a ticket to view details
                    </Card>
                )}
            </div>
        </div>
    );
}
