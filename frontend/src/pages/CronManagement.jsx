import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Play, CheckCircle2, XCircle, Clock, Info, ShieldCheck, RefreshCcw, Activity } from "lucide-react";
import api from "@/lib/api";

const CronManagement = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const response = await api.get('/cron/jobs');
            if (response.data.success) {
                setJobs(response.data.jobs);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch cron jobs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleTrigger = async (id, name) => {
        try {
            toast.info(`Triggering ${name}...`);
            const response = await api.post(`/cron/jobs/${id}/trigger`);
            if (response.data.success) {
                toast.success(`${name} triggered successfully`);
                // Refresh after a delay to see status change
                setTimeout(fetchJobs, 1500);
            }
        } catch (error) {
            toast.error(`Failed to trigger ${name}`);
        }
    };

    const handleToggle = async (id, name, currentState) => {
        try {
            const response = await api.patch(`/cron/jobs/${id}/toggle`, { isActive: !currentState });
            if (response.data.success) {
                toast.success(`${name} ${!currentState ? 'enabled' : 'disabled'}`);
                setJobs(jobs.map(job => job.id === id ? { ...job, isActive: !currentState } : job));
            }
        } catch (error) {
            toast.error("Failed to update job status");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'RUNNING':
                return <Badge className="bg-blue-500 hover:bg-blue-600 animate-pulse">Running</Badge>;
            case 'COMPLETED':
            case 'IDLE':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600">Success</Badge>;
            case 'FAILED':
                return <Badge className="bg-rose-500 hover:bg-rose-600">Failed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        System Schedulers
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Activity className="h-4 w-4 text-indigo-500" />
                        Live monitoring and management of automated background tasks
                    </p>
                </div>
                <Button onClick={fetchJobs} variant="outline" className="rounded-full px-6 shadow-sm hover:shadow-md transition-all">
                    <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Operations
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-blue-700 flex items-center gap-2 text-lg font-bold">
                            <Clock className="h-5 w-5 bg-blue-100 p-1 rounded-md" />
                            Upcoming Event
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-blue-900 tracking-tight">Daily Sales</p>
                        <p className="text-sm text-blue-600/80 font-medium">Auto-reports at 9:00 PM</p>
                    </CardContent>
                </Card>
                
                <Card className="border-none bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-emerald-700 flex items-center gap-2 text-lg font-bold">
                            <ShieldCheck className="h-5 w-5 bg-emerald-100 p-1 rounded-md" />
                            Reliability Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-emerald-900 tracking-tight">99.8%</p>
                        <p className="text-sm text-emerald-600/80 font-medium">All systems operational</p>
                    </CardContent>
                </Card>
                
                <Card className="border-none bg-gradient-to-br from-indigo-500/10 via-white to-indigo-500/5 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-indigo-700 flex items-center gap-2 text-lg font-bold">
                            <Activity className="h-5 w-5 bg-indigo-100 p-1 rounded-md" />
                            Total Throughput
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-indigo-900 tracking-tight">{jobs.length} Active</p>
                        <p className="text-sm text-indigo-600/80 font-medium">Managed background workers</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                <CardHeader className="border-bottom">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-800">Job Registry</CardTitle>
                            <CardDescription>Execution history and scheduling parameters</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[300px]">Job Identity</TableHead>
                                    <TableHead>Execution Frequency</TableHead>
                                    <TableHead>Last Vital Sign</TableHead>
                                    <TableHead>Environment Status</TableHead>
                                    <TableHead>Operational</TableHead>
                                    <TableHead className="text-right">Manual Override</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            No jobs currently registered in the system.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {jobs.map((job) => (
                                    <TableRow key={job.id} className="group hover:bg-slate-50/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm">
                                                    {job.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{job.name}</div>
                                                    <div className="text-xs text-slate-500 max-w-[250px] line-clamp-2" title={job.description}>
                                                        {job.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-[10px] bg-slate-900 text-slate-50 px-2 py-1 rounded font-mono font-medium shadow-sm">
                                                {job.schedule}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-slate-600">
                                            {job.lastRun ? new Date(job.lastRun).toLocaleString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : (
                                                <span className="text-slate-300 italic">No data</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(job.status)}
                                        </TableCell>
                                        <TableCell>
                                            <Switch 
                                                checked={job.isActive} 
                                                onCheckedChange={() => handleToggle(job.id, job.name, job.isActive)}
                                                className="data-[state=checked]:bg-indigo-600"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                className="border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold"
                                                onClick={() => handleTrigger(job.id, job.name)}
                                                disabled={job.status === 'RUNNING' || !job.isActive}
                                            >
                                                <Play className="h-3.5 w-3.5 mr-2 fill-current" />
                                                Run Now
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground bg-slate-50 p-3 rounded-lg border border-slate-100">
                <Info className="h-3 w-3" />
                <span>All timestamps are relative to the server time in UTC+5:30. Jobs marked as 'Success' are ready for their next scheduled cycle.</span>
            </div>
        </div>
    );
};

export default CronManagement;
