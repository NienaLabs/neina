"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/trpc/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    MessageSquare,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    AlertCircle,
    Send,
    User,
    ChevronRight,
    SearchX
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function SupportDashboard() {
    const utils = trpc.useUtils();
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyMessage, setReplyMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

    const { data: tickets, isLoading } = trpc.admin.getSupportTickets.useQuery({});
    const { data: ticketDetails, isLoading: isLoadingDetails } = trpc.admin.getTicketDetails.useQuery(
        { ticketId: selectedTicketId! },
        { enabled: !!selectedTicketId }
    );

    const replyMutation = trpc.admin.replyToTicket.useMutation({
        onSuccess: () => {
            setReplyMessage("");
            utils.admin.getSupportTickets.invalidate();
            utils.admin.getTicketDetails.invalidate();
        },
    });

    const closeTicketMutation = trpc.admin.closeTicket.useMutation({
        onSuccess: () => {
            utils.admin.getSupportTickets.invalidate();
            utils.admin.getTicketDetails.invalidate();
        },
    });

    const filteredTickets = useMemo(() => {
        if (!tickets) return [];
        return tickets.filter(ticket => {
            const matchesSearch =
                ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [tickets, searchQuery, statusFilter]);

    const handleReply = (shouldClose: boolean = false) => {
        if (!selectedTicketId || !replyMessage.trim()) return;
        replyMutation.mutate({
            ticketId: selectedTicketId,
            message: replyMessage,
            shouldClose
        });
    };

    const handleCloseTicket = () => {
        if (!selectedTicketId) return;
        if (confirm("Are you sure you want to close this ticket?")) {
            closeTicketMutation.mutate({ ticketId: selectedTicketId });
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'open':
                return (
                    <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-200 gap-1 px-2">
                        <AlertCircle className="h-3 w-3" />
                        Open
                    </Badge>
                );
            case 'closed':
                return (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1 px-2">
                        <CheckCircle2 className="h-3 w-3" />
                        Closed
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="flex h-[calc(100vh-12rem)] min-h-[600px] border border-border/50 rounded-2xl bg-white overflow-hidden shadow-sm">
            {/* Sidebar: Ticket List */}
            <div className="w-80 md:w-96 flex flex-col border-r border-border/50 bg-slate-50/30">
                <div className="p-4 space-y-4 border-b border-border/50 bg-white">
                    <div className="flex items-center justify-between">
                        <h3 className="font-syne font-bold text-lg">Inbox</h3>
                        <Badge variant="outline" className="font-mono text-xs">
                            {filteredTickets.length} Tickets
                        </Badge>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tickets..."
                            className="pl-9 bg-secondary/50 border-transparent focus:bg-white transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={statusFilter === 'all' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 text-xs flex-1 rounded-lg"
                            onClick={() => setStatusFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={statusFilter === 'open' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 text-xs flex-1 rounded-lg"
                            onClick={() => setStatusFilter('open')}
                        >
                            Open
                        </Button>
                        <Button
                            variant={statusFilter === 'closed' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 text-xs flex-1 rounded-lg"
                            onClick={() => setStatusFilter('closed')}
                        >
                            Closed
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="flex flex-col">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="p-4 border-b border-border/30 animate-pulse">
                                    <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
                                    <div className="h-3 w-1/2 bg-slate-100 rounded" />
                                </div>
                            ))
                        ) : filteredTickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <SearchX className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                                <p className="text-sm font-medium text-muted-foreground">No tickets found</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters or search query.</p>
                            </div>
                        ) : (
                            filteredTickets.map((ticket) => (
                                <button
                                    key={ticket.id}
                                    onClick={() => setSelectedTicketId(ticket.id)}
                                    className={cn(
                                        "w-full text-left p-4 transition-all border-b border-border/30 hover:bg-white group relative",
                                        selectedTicketId === ticket.id ? "bg-white shadow-[inset_4px_0_0_0_theme(colors.primary.DEFAULT)]" : "hover:bg-slate-100/50"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={cn(
                                            "font-semibold text-sm truncate pr-2",
                                            selectedTicketId === ticket.id ? "text-primary" : "text-slate-700"
                                        )}>
                                            {ticket.subject}
                                        </h4>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Avatar className="h-5 w-5 border border-border/50">
                                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                {ticket.user.email[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs text-muted-foreground truncate">
                                            {ticket.user.email}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <StatusBadge status={ticket.status} />
                                        <ChevronRight className={cn(
                                            "h-4 w-4 text-muted-foreground transition-transform",
                                            selectedTicketId === ticket.id ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                                        )} />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content: Ticket Details & Chat */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedTicketId ? (
                    <>
                        {/* Detail Header */}
                        <div className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-white">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-9 w-9 border border-border/50">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {ticketDetails?.user.name?.[0] || ticketDetails?.user.email?.[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-sm leading-none">{ticketDetails?.subject}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {ticketDetails?.user.name} ({ticketDetails?.user.email})
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {ticketDetails?.status === 'open' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                        onClick={handleCloseTicket}
                                        disabled={closeTicketMutation.isPending}
                                    >
                                        {closeTicketMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                                        Mark Resolved
                                    </Button>
                                )}
                                <Badge variant="outline" className="h-8 px-3 uppercase tracking-wider text-[10px] font-bold">
                                    {ticketDetails?.status}
                                </Badge>
                            </div>
                        </div>

                        {/* Chat Messages Area */}
                        <ScrollArea className="flex-1 p-6 bg-slate-50/30">
                            {isLoadingDetails ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                                </div>
                            ) : (
                                <div className="space-y-6 max-w-4xl mx-auto">
                                    {ticketDetails?.messages.map((msg, idx) => {
                                        const isSystem = msg.sender === 'system';
                                        const isAdmin = msg.sender === 'admin';
                                        return (
                                            <div key={msg.id} className={cn(
                                                "flex flex-col group",
                                                isAdmin ? "items-end" : "items-start"
                                            )}>
                                                <div className={cn(
                                                    "flex items-end gap-2",
                                                    isAdmin ? "flex-row-reverse" : "flex-row"
                                                )}>
                                                    <Avatar className="h-7 w-7 border border-border/20 shadow-sm shrink-0">
                                                        <AvatarFallback className={cn(
                                                            "text-[10px] font-bold",
                                                            isAdmin ? "bg-slate-800 text-white" : "bg-primary/10 text-primary"
                                                        )}>
                                                            {isAdmin ? 'AD' : (ticketDetails.user.name?.[0] || 'U')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className={cn(
                                                        "relative max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm transition-shadow",
                                                        isAdmin
                                                            ? "bg-slate-900 text-white rounded-br-none"
                                                            : "bg-white border border-border/50 text-slate-700 rounded-bl-none hover:shadow-md"
                                                    )}>
                                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground mt-1.5 px-9">
                                                    {format(new Date(msg.createdAt), "h:mm a")}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Reply Area */}
                        {ticketDetails?.status !== 'closed' ? (
                            <div className="p-4 border-t border-border/50 bg-white">
                                <div className="max-w-4xl mx-auto relative group">
                                    <Textarea
                                        placeholder="Type your reply to the user..."
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        className="min-h-[100px] w-full p-4 pb-12 bg-slate-50 border-transparent focus:bg-white focus:border-primary/20 rounded-xl resize-none transition-all shadow-inner"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.ctrlKey) {
                                                handleReply();
                                            }
                                        }}
                                    />
                                    <div className="absolute bottom-3 right-3 flex items-center gap-3">
                                        <p className="text-[10px] text-muted-foreground opacity-0 group-focus-within:opacity-100 transition-opacity">
                                            Ctrl + Enter to send
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-2 rounded-lg px-4 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                            onClick={() => handleReply(true)}
                                            disabled={!replyMessage.trim() || replyMutation.isPending}
                                        >
                                            {replyMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                            Reply & Resolve
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-8 gap-2 rounded-lg px-4"
                                            onClick={() => handleReply(false)}
                                            disabled={!replyMessage.trim() || replyMutation.isPending}
                                        >
                                            {replyMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                            Reply
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-slate-50 border-t border-border/50">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2 opacity-50" />
                                <p className="text-sm font-medium text-muted-foreground">This ticket has been marked as resolved.</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Further messages cannot be sent.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
                        <div className="h-20 w-20 rounded-full bg-white border border-border/50 flex items-center justify-center mb-6 shadow-sm">
                            <MessageSquare className="h-10 w-10 text-primary/40" />
                        </div>
                        <h2 className="text-xl font-syne font-bold text-slate-800">Select a support ticket</h2>
                        <p className="text-muted-foreground max-w-xs mt-2 text-sm leading-relaxed">
                            Click on a ticket from the sidebar to view the conversation history and respond to the user.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
