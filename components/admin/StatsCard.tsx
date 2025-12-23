
import { ReactNode } from "react";

interface StatsCardProps {
    title: string;
    total: string;
    icon: ReactNode;
}

export function StatsCard({ title, total, icon }: StatsCardProps) {
    return (
        <div className="rounded-sm border border-stroke bg-white py-6 px-6 shadow-default dark:border-strokedark dark:bg-boxdark h-full">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-meta-4">
                {icon}
            </div>

            <div className="mt-4 flex items-end justify-between">
                <div>
                    <h4 className="text-title-md font-bold text-black dark:text-white">
                        {total}
                    </h4>
                    <span className="text-sm font-medium text-slate-500">{title}</span>
                </div>
            </div>
        </div>
    );
}
