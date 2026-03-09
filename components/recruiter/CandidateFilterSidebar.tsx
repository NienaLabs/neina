"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { X, Filter, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export interface FilterState {
    minScore: number;
    status: string[];
    hasResume: boolean;
}

interface CandidateFilterSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
    counts?: {
        total: number;
        filtered: number;
    };
}

const STATUS_OPTIONS = [
    { id: 'NEW', label: 'New' },
    { id: 'REVIEWING', label: 'Reviewing' },
    { id: 'SHORTLISTED', label: 'Shortlisted' },
    { id: 'INTERVIEWED', label: 'Interviewed' },
    { id: 'OFFERED', label: 'Offer Sent' },
    { id: 'HIRED', label: 'Hired' },
    { id: 'REJECTED', label: 'Rejected' },
];

/**
 * CandidateFilterSidebar Component
 * 
 * A sliding sidebar containing filtering options for the recruitment pipeline.
 * Manages local filter state and communicates changes back to the parent board.
 * 
 * @param {boolean} props.isOpen - Controls the visibility of the sidebar.
 * @param {Function} props.onClose - Callback to close the sidebar.
 * @param {FilterState} props.filters - The current active filter state.
 * @param {Function} props.setFilters - Function to update the parent's filter state.
 * @param {Object} [props.counts] - Optional counts of total vs filtered candidates for display.
 */
export function CandidateFilterSidebar({
    isOpen,
    onClose,
    filters,
    setFilters,
    counts
}: CandidateFilterSidebarProps) {
    const activeFiltersCount = (filters.minScore > 0 ? 1 : 0) +
        (filters.status.length > 0 ? 1 : 0) +
        (filters.hasResume ? 1 : 0);

    const resetFilters = () => {
        setFilters({
            minScore: 0,
            status: [],
            hasResume: false
        });
    };

    const toggleStatus = (statusId: string) => {
        setFilters({
            ...filters,
            status: filters.status.includes(statusId)
                ? filters.status.filter(s => s !== statusId)
                : [...filters.status, statusId]
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="h-full border-l bg-white/50 backdrop-blur-xl shrink-0 overflow-hidden flex flex-col"
                >
                    <div className="p-5 border-b flex items-center justify-between bg-white/40">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-indigo-600" />
                            <h3 className="font-bold text-sm">Filters</h3>
                            {activeFiltersCount > 0 && (
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] min-w-[20px] justify-center bg-indigo-100 text-indigo-700">
                                    {activeFiltersCount}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {activeFiltersCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-red-500"
                                    onClick={resetFilters}
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-8">
                        {/* Match Score */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Match Score</Label>
                                <span className="text-xs font-bold text-indigo-600">{filters.minScore}%+</span>
                            </div>
                            <Slider
                                value={[filters.minScore]}
                                onValueChange={(val) => setFilters({ ...filters, minScore: val[0] })}
                                max={100}
                                step={10}
                                className="py-2"
                            />
                            <div className="text-[10px] text-muted-foreground">
                                Show candidates with a match score of {filters.minScore}% or higher.
                            </div>
                        </div>

                        <Separator />

                        {/* Status */}
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {STATUS_OPTIONS.map((status) => (
                                    <div
                                        key={status.id}
                                        onClick={() => toggleStatus(status.id)}
                                        className={`
                                            cursor-pointer text-xs font-medium px-3 py-2 rounded-lg border transition-all text-center select-none
                                            ${filters.status.includes(status.id)
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                                                : 'hover:bg-slate-50 border-transparent bg-white/50 text-slate-600'}
                                        `}
                                    >
                                        {status.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Toggles */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-slate-700">Has Resume</Label>
                                <Switch
                                    checked={filters.hasResume}
                                    onCheckedChange={(val) => setFilters({ ...filters, hasResume: val })}
                                />
                            </div>
                        </div>
                    </div>

                    {counts && (
                        <div className="p-4 border-t bg-slate-50/50 text-center">
                            <p className="text-xs text-muted-foreground font-medium">
                                Showing <span className="text-foreground font-bold">{counts.filtered}</span> of {counts.total} candidates
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
