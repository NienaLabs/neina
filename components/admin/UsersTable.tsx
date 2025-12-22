"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
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
import { Loader2, MoreHorizontal } from "lucide-react";
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

export function UsersTable() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "suspended">("all");

    const { data, isLoading, isError, error } = trpc.admin.getUsers.useQuery({
        search,
        filter,
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
        return <div className="text-red-500">Error: {error.message}</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select
                    value={filter}
                    onValueChange={(value: "all" | "active" | "suspended") =>
                        setFilter(value)
                    }
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : data?.users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="flex items-center gap-3 py-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={user.image || undefined} />
                                            <AvatarFallback>
                                                {user.name?.charAt(0).toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-base">{user.name}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {user.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {user.plan}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.isSuspended ? (
                                            <Badge variant="destructive">Suspended</Badge>
                                        ) : (
                                            <Badge variant="secondary">Active</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onClick={() => handleToggleSuspend(user.id, user.isSuspended)}
                                                    className={user.isSuspended ? "text-green-600" : "text-red-600"}
                                                >
                                                    {user.isSuspended ? "Activate User" : "Suspend User"}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>Change Plan</DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuItem onClick={() => handleUpdatePlan(user.id, "FREE")}>
                                                            Free
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdatePlan(user.id, "SILVER")}>
                                                            Silver
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdatePlan(user.id, "GOLD")}>
                                                            Gold
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdatePlan(user.id, "DIAMOND")}>
                                                            Diamond
                                                        </DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuItem onClick={() => handleUpdateRole(user.id, "user")}>
                                                            User
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateRole(user.id, "recruiter")}>
                                                            Recruiter
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateRole(user.id, "admin")}>
                                                            Admin
                                                        </DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
