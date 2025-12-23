
import { StatsCard } from "@/components/admin/StatsCard";

import prisma from "@/lib/prisma";
import { Users, Briefcase, Video, FileText } from "lucide-react";

export default async function AdminPage() {
    const [userCount, jobCount, interviewCount, resumeCount, recentUsers] = await Promise.all([
        prisma.user.count(),
        prisma.jobs.count(),
        prisma.interview.count(),
        prisma.resume.count(),
        prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                role: true,
                image: true
            }
        })
    ]);

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-8">
            <StatsCard
                title="Total Users"
                total={userCount.toString()}
                icon={<Users className="text-primary h-6 w-6" />}
            />
            <StatsCard
                title="Total Jobs"
                total={jobCount.toString()}
                icon={<Briefcase className="text-primary h-6 w-6" />}
            />
            <StatsCard
                title="Interviews"
                total={interviewCount.toString()}
                icon={<Video className="text-primary h-6 w-6" />}
            />
            <StatsCard
                title="Resumes"
                total={resumeCount.toString()}
                icon={<FileText className="text-primary h-6 w-6" />}
            />

            <div className="col-span-full mt-4">
                <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                    <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
                        Recent Users
                    </h4>

                    <div className="flex flex-col">
                        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-4">
                            <div className="p-2.5 xl:p-5">
                                <h5 className="text-sm font-medium uppercase xsm:text-base">User</h5>
                            </div>
                            <div className="p-2.5 text-center xl:p-5">
                                <h5 className="text-sm font-medium uppercase xsm:text-base">Email</h5>
                            </div>
                            <div className="hidden p-2.5 text-center sm:block xl:p-5">
                                <h5 className="text-sm font-medium uppercase xsm:text-base">Role</h5>
                            </div>
                        </div>

                        {recentUsers.map((user, key) => (
                            <div className={`grid grid-cols-3 sm:grid-cols-4 ${key === recentUsers.length - 1 ? "" : "border-b border-stroke dark:border-strokedark"}`} key={user.id}>
                                <div className="flex items-center gap-3 p-2.5 xl:p-5">
                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                        {user.image ? <img src={user.image} alt="User" /> : <span className="text-lg font-bold text-slate-500">{user.name.charAt(0)}</span>}
                                    </div>
                                    <p className="hidden text-black dark:text-white sm:block">{user.name}</p>
                                </div>

                                <div className="flex items-center justify-center p-2.5 xl:p-5">
                                    <p className="text-meta-3 text-xs">{user.email}</p>
                                </div>

                                <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                                    <p className="text-black dark:text-white capitalize">{user.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
