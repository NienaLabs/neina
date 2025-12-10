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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Plus, Megaphone } from "lucide-react";
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

export function AnnouncementManager() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: "",
        content: "",
        type: "in-app" as "in-app" | "email" | "both",
    });

    const { data: announcements, isLoading } = trpc.admin.getAnnouncements.useQuery();
    const utils = trpc.useUtils();

    const createAnnouncementMutation = trpc.admin.createAnnouncement.useMutation({
        onSuccess: () => {
            utils.admin.getAnnouncements.invalidate();
            toast.success("Announcement created successfully");
            setIsCreateDialogOpen(false);
            setNewAnnouncement({ title: "", content: "", type: "in-app" });
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
        createAnnouncementMutation.mutate(newAnnouncement);
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
                    <DialogContent className="max-w-2xl">
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
                    </DialogContent>
                </Dialog>
            </div>

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
        </div>
    );
}
