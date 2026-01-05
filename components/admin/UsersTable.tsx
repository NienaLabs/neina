"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, UserCheck, UserX, Shield, CreditCard, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AdminCard } from "./AdminCard";

export function UsersTable() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "suspended">("all");
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, error } = trpc.admin.getUsers.useQuery({
        search,
        filter,
        page,
        limit: 10,
    });

    const utils = trpc.useUtils();

    const toggleSuspendMutation = trpc.admin.toggleUserSuspension.useMutation({
        onSuccess: () => {
            utils.admin.getUsers.invalidate();
            toast.success("User status updated");
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const updatePlanMutation = trpc.admin.updateUserPlan.useMutation({
        onSuccess: () => {
            utils.admin.getUsers.invalidate();
            toast.success("User plan updated");
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
        onSuccess: () => {
            utils.admin.getUsers.invalidate();
            toast.success("User role updated");
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const sendNotificationMutation = trpc.admin.sendJobNotifications.useMutation();

    const handleToggleSuspend = (userId: string, currentStatus: boolean) => {
        toggleSuspendMutation.mutate({ userId, isSuspended: !currentStatus });
    };

    const handleUpdatePlan = (userId: string, plan: "FREE" | "SILVER" | "GOLD" | "DIAMOND") => {
        updatePlanMutation.mutate({ userId, plan });
    };

    const handleUpdateRole = (userId: string, role: string) => {
        updateRoleMutation.mutate({ userId, role });
    };

    if (isError) {
        return (
            <AdminCard className="border-destructive/20 bg-destructive/5">
                <div className="text-destructive font-bold flex items-center gap-2">
                    <UserX className="h-5 w-5" />
                    Error loading users: {error.message}
                </div>
            </AdminCard>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-border/50">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border-transparent focus:border-primary/20 pl-10 h-10 rounded-xl transition-all"
                    />
                </div>
                <Select
                    value={filter}
                    onValueChange={(value: "all" | "active" | "suspended") =>
                        setFilter(value)
                    }
                >
                    <SelectTrigger className="w-full md:w-[180px] bg-white rounded-xl border-transparent focus:border-primary/20 h-10">
                        <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl p-1">
                        <SelectItem value="all" className="rounded-lg">All Users</SelectItem>
                        <SelectItem value="active" className="rounded-lg">Active</SelectItem>
                        <SelectItem value="suspended" className="rounded-lg">Suspended</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table Container */}
            <AdminCard className="overflow-hidden border-none shadow-xl shadow-slate-200/50 p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-secondary/30">
                            <TableRow className="hover:bg-transparent border-b-border/50">
                                <TableHead className="font-bold py-4 px-6 text-[11px] uppercase tracking-widest text-muted-foreground">User Information</TableHead>
                                <TableHead className="font-bold py-4 text-[11px] uppercase tracking-widest text-muted-foreground text-center">Identity</TableHead>
                                <TableHead className="font-bold py-4 text-[11px] uppercase tracking-widest text-muted-foreground text-center">Billing</TableHead>
                                <TableHead className="font-bold py-4 text-[11px] uppercase tracking-widest text-muted-foreground text-center">Status</TableHead>
                                <TableHead className="font-bold py-4 text-[11px] uppercase tracking-widest text-muted-foreground">Joined Date</TableHead>
                                <TableHead className="text-right py-4 px-6 text-[11px] uppercase tracking-widest text-muted-foreground">Manage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-sm font-medium text-muted-foreground">Refining user data...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : data?.users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                            <UserX className="h-10 w-10 text-muted-foreground" />
                                            <p className="font-syne font-bold text-lg">No Users Found</p>
                                            <p className="text-sm">Try adjusting your filters or search term.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.users.map((user) => (
                                    <TableRow key={user.id} className="group hover:bg-secondary/20 transition-colors border-b-border/30">
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-11 w-11 border-2 border-white shadow-sm ring-1 ring-border/50">
                                                    <AvatarImage src={user.image || undefined} />
                                                    <AvatarFallback className="bg-primary/5 text-primary font-bold">
                                                        {user.name?.charAt(0).toUpperCase() || "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold font-syne text-sm text-foreground group-hover:text-primary transition-colors">
                                                        {user.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="capitalize text-[10px] font-bold tracking-wider px-2 py-0.5 bg-white shadow-sm">
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="capitalize text-[10px] font-bold tracking-wider px-2 py-0.5 bg-slate-100/50">
                                                {user.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {user.isSuspended ? (
                                                <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-tighter px-2">Suspended</Badge>
                                            ) : (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-bold uppercase tracking-tighter px-2 hover:bg-emerald-100">Active</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-muted-foreground">
                                            {format(new Date(user.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right py-4 px-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-xl p-2" sideOffset={8}>
                                                    <DropdownMenuLabel className="font-syne font-bold px-3 py-2">Quick Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className="bg-border/50" />

                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleSuspend(user.id, user.isSuspended)}
                                                        className={cn(
                                                            "rounded-lg px-3 py-2 cursor-pointer gap-2 transition-colors",
                                                            user.isSuspended ? "text-emerald-600 focus:bg-emerald-50 focus:text-emerald-600" : "text-red-600 focus:bg-red-50 focus:text-red-600"
                                                        )}
                                                    >
                                                        {user.isSuspended ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                                        <span>{user.isSuspended ? "Reactivate Account" : "Suspend Account"}</span>
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator className="bg-border/50" />

                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger className="rounded-lg px-3 py-2 cursor-pointer gap-2">
                                                            <CreditCard className="h-4 w-4" />
                                                            <span>Adjust Billing Plan</span>
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent className="rounded-xl p-1 ml-1">
                                                            {["FREE", "SILVER", "GOLD", "DIAMOND"].map((plan) => (
                                                                <DropdownMenuItem
                                                                    key={plan}
                                                                    onClick={() => handleUpdatePlan(user.id, plan as any)}
                                                                    className="rounded-lg text-xs font-bold"
                                                                >
                                                                    {plan}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>

                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger className="rounded-lg px-3 py-2 cursor-pointer gap-2">
                                                            <Shield className="h-4 w-4" />
                                                            <span>Change Permissions</span>
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent className="rounded-xl p-1 ml-1">
                                                            {["user", "recruiter", "admin"].map((role) => (
                                                                <DropdownMenuItem
                                                                    key={role}
                                                                    onClick={() => handleUpdateRole(user.id, role)}
                                                                    className="rounded-lg text-xs font-bold capitalize"
                                                                >
                                                                    {role}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>

                                                    <DropdownMenuSeparator className="bg-border/50" />

                                                    <DropdownMenuItem
                                                        className="rounded-lg px-3 py-2 cursor-pointer gap-2 group"
                                                        onClick={() => {
                                                            const promise = sendNotificationMutation.mutateAsync({ userId: user.id });
                                                            toast.promise(promise, {
                                                                loading: 'Dispatching notification...',
                                                                success: 'Job alert broadcasted!',
                                                                error: (err: any) => err.message || 'Transmission failed'
                                                            });
                                                        }}
                                                    >
                                                        <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                        <span>Send Job Alert</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination UI */}
                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-secondary/10">
                        <div className="text-xs text-muted-foreground font-medium">
                            Showing <span className="text-foreground font-bold">{(page - 1) * 10 + 1}</span> to <span className="text-foreground font-bold">{Math.min(page * 10, data.total)}</span> of <span className="text-foreground font-bold">{data.total}</span> users
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="h-9 rounded-xl px-4 gap-2 hover:bg-white transition-all shadow-sm disabled:opacity-30"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Previous</span>
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                                    // Logic for showing a window of pages can be added if totalPages is high
                                    const pageNum = i + 1;
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={page === pageNum ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setPage(pageNum)}
                                            className={cn(
                                                "h-9 w-9 rounded-xl font-bold p-0 transition-all",
                                                page === pageNum ? "shadow-md shadow-primary/20" : "hover:bg-white shadow-sm"
                                            )}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                                {data.totalPages > 5 && (
                                    <span className="px-2 text-muted-foreground font-bold text-xs italic">...</span>
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === data.totalPages}
                                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                className="h-9 rounded-xl px-4 gap-2 hover:bg-white transition-all shadow-sm disabled:opacity-30"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </AdminCard>
        </div>
    );
}
