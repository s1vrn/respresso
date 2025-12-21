import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Users, DollarSign, Gamepad2, Package, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<{
        userCount: number
        activeSessions: number
        productCount: number
        totalDebt: number
        lowStock: any[]
    } | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchStats = async () => {
        setLoading(true)
        const result = await window.api.getDashboardStats()
        if (result.success && result.stats) {
            setStats(result.stats as any)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchStats()
    }, [])

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.userCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Registered customers</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                        <Gamepad2 className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Players currently playing</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Debt</CardTitle>
                        <DollarSign className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.totalDebt || 0).toFixed(2)} DH</div>
                        <p className="text-xs text-muted-foreground mt-1">Total client balance</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.productCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Items in inventory</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-2 shadow-none">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="text-sm font-bold">Quick Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground text-sm italic">Daily performance graph will be here.</p>
                    </CardContent>
                </Card>
                <Card className="col-span-3 border-2 shadow-none overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            Low Stock Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {stats?.lowStock?.length === 0 ? (
                                <div className="py-20 text-center text-muted-foreground text-sm">All items healthy!</div>
                            ) : (
                                stats?.lowStock?.map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                        <div className="font-bold text-sm">{p.name}</div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-mono font-bold text-destructive">{p.stock} left</span>
                                            <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold" onClick={() => window.location.href = '/inventory'}>RESTOCK</Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Shorthand for cn helper if not imported
import { cn } from '../lib/utils'
