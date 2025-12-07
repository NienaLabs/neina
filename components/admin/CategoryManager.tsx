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
import { Loader2, Trash2, Plus, Edit } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";

export function CategoryManager() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [newCategory, setNewCategory] = useState({
        category: "",
        location: "",
        active: true,
    });

    const { data: categories, isLoading } = trpc.admin.getCategories.useQuery();
    const utils = trpc.useUtils();

    const createCategoryMutation = trpc.admin.createCategory.useMutation({
        onSuccess: () => {
            utils.admin.getCategories.invalidate();
            toast.success("Category created successfully");
            setIsAddDialogOpen(false);
            setNewCategory({ category: "", location: "", active: true });
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    const updateCategoryMutation = trpc.admin.updateCategory.useMutation({
        onSuccess: () => {
            utils.admin.getCategories.invalidate();
            toast.success("Category updated successfully");
            setIsEditDialogOpen(false);
            setSelectedCategory(null);
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    const deleteCategoryMutation = trpc.admin.deleteCategory.useMutation({
        onSuccess: () => {
            utils.admin.getCategories.invalidate();
            toast.success("Category deleted successfully");
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    const handleCreateCategory = () => {
        if (!newCategory.category) {
            toast.error("Category name is required");
            return;
        }
        createCategoryMutation.mutate(newCategory);
    };

    const handleUpdateCategory = () => {
        if (!selectedCategory) return;
        updateCategoryMutation.mutate({
            id: selectedCategory.id,
            category: selectedCategory.category,
            location: selectedCategory.location,
            active: selectedCategory.active,
        });
    };

    const handleDeleteCategory = (id: string) => {
        if (confirm("Are you sure you want to delete this category?")) {
            deleteCategoryMutation.mutate({ id });
        }
    };

    const openEditDialog = (category: any) => {
        setSelectedCategory(category);
        setIsEditDialogOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Job Categories</h3>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Category</DialogTitle>
                            <DialogDescription>
                                Create a new job category for the job sync system.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category Name *</Label>
                                <Input
                                    id="category"
                                    value={newCategory.category}
                                    onChange={(e) =>
                                        setNewCategory({ ...newCategory, category: e.target.value })
                                    }
                                    placeholder="e.g., Software Engineer"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={newCategory.location}
                                    onChange={(e) =>
                                        setNewCategory({ ...newCategory, location: e.target.value })
                                    }
                                    placeholder="e.g., Remote, New York"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="active"
                                    checked={newCategory.active}
                                    onCheckedChange={(checked) =>
                                        setNewCategory({ ...newCategory, active: !!checked })
                                    }
                                />
                                <Label htmlFor="active">Active</Label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsAddDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateCategory}
                                disabled={createCategoryMutation.isPending}
                            >
                                {createCategoryMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Create
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Fetched</TableHead>
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
                        ) : categories?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No categories found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories?.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">
                                        {category.category}
                                    </TableCell>
                                    <TableCell>{category.location || "N/A"}</TableCell>
                                    <TableCell>
                                        {category.active ? (
                                            <Badge variant="secondary">Active</Badge>
                                        ) : (
                                            <Badge variant="outline">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {category.last_fetched_at
                                            ? format(
                                                new Date(category.last_fetched_at),
                                                "MMM d, yyyy"
                                            )
                                            : "Never"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditDialog(category)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteCategory(category.id)}
                                                disabled={deleteCategoryMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                        <DialogDescription>
                            Update the category details.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedCategory && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-category">Category Name</Label>
                                <Input
                                    id="edit-category"
                                    value={selectedCategory.category}
                                    onChange={(e) =>
                                        setSelectedCategory({
                                            ...selectedCategory,
                                            category: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-location">Location</Label>
                                <Input
                                    id="edit-location"
                                    value={selectedCategory.location || ""}
                                    onChange={(e) =>
                                        setSelectedCategory({
                                            ...selectedCategory,
                                            location: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="edit-active"
                                    checked={selectedCategory.active}
                                    onCheckedChange={(checked) =>
                                        setSelectedCategory({
                                            ...selectedCategory,
                                            active: !!checked,
                                        })
                                    }
                                />
                                <Label htmlFor="edit-active">Active</Label>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateCategory}
                            disabled={updateCategoryMutation.isPending}
                        >
                            {updateCategoryMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Update
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
