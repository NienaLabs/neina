"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/trpc/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Plus, Megaphone, X, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Helper for selected users display
function SelectedUserBadge({ name, onRemove }: { name: string; onRemove: () => void }) {
    return (
        <Badge variant="secondary" className="flex items-center gap-1 pr-1">
            {name}
            <button onClick={onRemove} className="hover:bg-muted rounded-full p-0.5">
                <X className="h-3 w-3" />
            </button>
        </Badge>
    );
}

export function AnnouncementManager() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: "",
        content: "",
        type: "in-app" as "in-app" | "email" | "both",
        targetUserIds: [] as string[],
    });

    // For user searching
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // For displaying selected users
    const [selectedUsers, setSelectedUsers] = useState<Array<{ id: string; name: string | null; email: string | null }>>([]);

    const { data: searchResults, isFetching } = trpc.admin.getUsers.useQuery(
        { search: debouncedSearch, limit: 50 },
        { placeholderData: (prev) => prev }
    );

    // Simple way to handle user selection without complex debounce hook right now
    const [targetType, setTargetType] = useState<"all" | "users">("all");

    const { data: announcements, isLoading } = trpc.admin.getAnnouncements.useQuery();
    const utils = trpc.useUtils();

    const createAnnouncementMutation = trpc.admin.createAnnouncement.useMutation({
        onSuccess: () => {
            utils.admin.getAnnouncements.invalidate();
            toast.success("Announcement created successfully");
            setIsCreateDialogOpen(false);
            setNewAnnouncement({ title: "", content: "", type: "in-app", targetUserIds: [] });
            setSelectedUsers([]);
            setTargetType("all");
            setSearchTerm("");
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    const deleteAnnouncementMutation = trpc.admin.deleteAnnouncement.useMutation({
        onSuccess: () => {
            utils.admin.getAnnouncements.invalidate();
            toast.success("Announcement deleted successfully");
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    const handleCreateAnnouncement = () => {
        if (!newAnnouncement.title || !newAnnouncement.content) {
            toast.error("Title and content are required");
            return;
        }
        // Ensure targetUserIds is synced with selectedUsers just in case
        const payload = {
            ...newAnnouncement,
            targetUserIds: targetType === 'users' ? selectedUsers.map(u => u.id) : []
        };
        createAnnouncementMutation.mutate(payload);
    };

    const handleDeleteAnnouncement = (id: string) => {
        if (confirm("Are you sure you want to delete this announcement?")) {
            deleteAnnouncementMutation.mutate({ id });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Announcements</h3>
                    <p className="text-sm text-muted-foreground">
                        Broadcast messages to your users
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Announcement
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95%] sm:max-w-lg max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Announcement</DialogTitle>
                            <DialogDescription>
                                Broadcast a message to all users on the platform.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={newAnnouncement.title}
                                    onChange={(e) =>
                                        setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                                    }
                                    placeholder="e.g., New Feature Released!"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="content">Content *</Label>
                                <Textarea
                                    id="content"
                                    value={newAnnouncement.content}
                                    onChange={(e) =>
                                        setNewAnnouncement({ ...newAnnouncement, content: e.target.value })
                                    }
                                    placeholder="Write your announcement message..."
                                    rows={6}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Delivery Type</Label>
                                <Select
                                    value={newAnnouncement.type}
                                    onValueChange={(value: "in-app" | "email" | "both") =>
                                        setNewAnnouncement({ ...newAnnouncement, type: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="in-app">In-App Only</SelectItem>
                                        <SelectItem value="email">Email Only</SelectItem>
                                        <SelectItem value="both">Both (In-App + Email)</SelectItem>
                                    </SelectContent>
                                </Select>

                            </div>

                            <div className="grid gap-2">
                                <Label>Target Audience</Label>
                                <RadioGroup
                                    value={targetType}
                                    onValueChange={(val: "all" | "users") => setTargetType(val)}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="all" id="all" />
                                        <Label htmlFor="all" className="cursor-pointer">All Users</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="users" id="users" />
                                        <Label htmlFor="users" className="cursor-pointer">Specific Users</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {targetType === "users" && (
                                <div className="grid gap-2 p-3 border rounded-md bg-muted/20">
                                    <Label>Search Users</Label>
                                    <Input
                                        placeholder="Type name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />

                                    {/* Search Results */}
                                    {searchResults?.users && (
                                        <div className="border rounded-md h-40 overflow-y-auto bg-white dark:bg-slate-950 mt-1 relative">
                                            {isFetching && (
                                                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10">
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                </div>
                                            )}
                                            {searchResults.users.length === 0 ? (
                                                <div className="p-2 text-sm text-muted-foreground text-center">No users found</div>
                                            ) : (
                                                searchResults.users.map(user => (
                                                    <div
                                                        key={user.id}
                                                        className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer text-sm"
                                                        onClick={() => {
                                                            if (!selectedUsers.some(u => u.id === user.id)) {
                                                                const newUser = { id: user.id, name: user.name, email: user.email };
                                                                setSelectedUsers(prev => [...prev, newUser]);
                                                                setNewAnnouncement(prev => ({
                                                                    ...prev,
                                                                    targetUserIds: [...prev.targetUserIds, user.id]
                                                                }));
                                                            }
                                                        }}
                                                    >
                                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                            {user.image ? (
                                                                <img src={user.image} className="rounded-full w-full h-full object-cover" />
                                                            ) : (
                                                                <UserIcon className="h-3 w-3" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 truncate">
                                                            <div className="font-medium">{user.name}</div>
                                                            <div className="text-muted-foreground text-xs">{user.email}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {/* Selected Users */}
                                    {selectedUsers.length > 0 && (
                                        <div className="mt-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <Label className="text-xs text-muted-foreground block">
                                                    Selected Users ({selectedUsers.length})
                                                </Label>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 text-xs px-1 hover:text-red-500"
                                                    onClick={() => {
                                                        setSelectedUsers([]);
                                                        setNewAnnouncement(prev => ({ ...prev, targetUserIds: [] }));
                                                    }}
                                                >
                                                    Clear All
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUsers.map(user => (
                                                    <SelectedUserBadge
                                                        key={user.id}
                                                        name={user.name || user.email || "Unknown User"}
                                                        onRemove={() => {
                                                            setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
                                                            setNewAnnouncement(prev => ({
                                                                ...prev,
                                                                targetUserIds: prev.targetUserIds.filter(id => id !== user.id)
                                                            }));
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsCreateDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateAnnouncement}
                                disabled={createAnnouncementMutation.isPending}
                            >
                                {createAnnouncementMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                <Megaphone className="mr-2 h-4 w-4" />
                                Broadcast
                            </Button>
                        </div>
                    </DialogContent >
                </Dialog >
            </div >

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Content</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Sent At</TableHead>
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
                        ) : announcements?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No announcements yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            announcements?.map((announcement) => (
                                <TableRow key={announcement.id}>
                                    <TableCell className="font-medium">
                                        {announcement.title}
                                    </TableCell>
                                    <TableCell className="max-w-md truncate">
                                        {announcement.content}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {announcement.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(announcement.sentAt), "MMM d, yyyy HH:mm")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                                            disabled={deleteAnnouncementMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div >
    );
}
