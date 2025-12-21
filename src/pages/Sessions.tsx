import React, { useState, useEffect } from "react"
import { Session } from "../types/electron"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Plus,
    Gamepad2,
    Square,
    History,
    Loader2
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const TimerCard: React.FC<{ session: Session; onComplete: () => void }> = ({ session, onComplete }) => {
    const [elapsed, setElapsed] = useState(0)
    const [isEndOpen, setIsEndOpen] = useState(false)
    const [cost, setCost] = useState(0)

    useEffect(() => {
        const start = new Date(session.startTime).getTime()
        const update = () => {
            const now = Date.now()
            setElapsed(Math.floor((now - start) / 1000))
        }
        update()
        const interval = setInterval(update, 1000)
        return () => clearInterval(interval)
    }, [session.startTime])

    const calculateSuggestedCost = () => {
        const minutes = Math.ceil(elapsed / 60)
        const matches = Math.ceil(minutes / 14)
        return matches * 5
    }

    const handleStop = async () => {
        const duration = Math.ceil(elapsed / 60)
        const result = await window.api.updateSession(session.id, {
            status: 'COMPLETED',
            endTime: new Date(),
            duration,
            cost
        })
        if (result.success) {
            setIsEndOpen(false)
            onComplete()
        } else {
            alert("Error: " + result.error)
        }
    }

    const handleCancel = async () => {
        if (!confirm("Cancel this session? No data will be saved.")) return
        const result = await window.api.updateSession(session.id, {
            status: 'CANCELLED',
            endTime: new Date()
        })
        if (result.success) onComplete()
    }

    return (
        <Card className="overflow-hidden border-2 border-primary/20 shadow-lg animate-in zoom-in-95">
            <CardHeader className="bg-primary/5 flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-primary/70">
                    <Gamepad2 className="h-4 w-4" /> PS-{session.id.slice(-4)}
                </CardTitle>
                <Badge className="bg-emerald-500 hover:bg-emerald-500 animate-pulse border-white border-2">LIVE</Badge>
            </CardHeader>
            <CardContent className="py-8">
                <div className="text-5xl font-black text-center font-mono tracking-tighter text-primary">
                    {formatDuration(elapsed)}
                </div>
                <div className="text-center mt-2 text-xs text-muted-foreground uppercase font-bold tracking-widest">
                    Elapsed Time
                </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2 bg-muted/30 pt-3">
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button variant="destructive" size="sm" className="font-bold" onClick={() => {
                    setCost(calculateSuggestedCost())
                    setIsEndOpen(true)
                }}>
                    <Square className="h-3 w-3 mr-2 fill-current" /> Finish
                </Button>
            </CardFooter>

            <Dialog open={isEndOpen} onOpenChange={setIsEndOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Session</DialogTitle>
                        <DialogDescription>
                            Duration: {Math.ceil(elapsed / 60)} minutes<br />
                            Rate: 5 DH per 14-min match
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Session Cost (DH)</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={cost}
                                    onChange={e => setCost(parseFloat(e.target.value))}
                                    className="text-2xl font-black h-12 pr-12"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">DH</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 text-xs" onClick={() => setCost(calculateSuggestedCost())}>
                                Reset to Suggested ({calculateSuggestedCost()} DH)
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEndOpen(false)}>Back</Button>
                        <Button onClick={handleStop} className="bg-emerald-600 hover:bg-emerald-700 font-bold">Collect & Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

export const Sessions: React.FC = () => {
    const [activeSessions, setActiveSessions] = useState<Session[]>([])
    const [history, setHistory] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        const [activeRes, historyRes] = await Promise.all([
            window.api.getActiveSessions(),
            window.api.getAllSessions()
        ])
        if (activeRes.success && activeRes.sessions) setActiveSessions(activeRes.sessions)
        if (historyRes.success && historyRes.sessions) {
            setHistory(historyRes.sessions.filter(s => s.status !== 'ACTIVE').slice(0, 20))
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const startNewSession = async () => {
        const result = await window.api.createSession({
            status: 'ACTIVE',
            startTime: new Date()
        })
        if (result.success) fetchData()
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">PlayStation Tracker</h1>
                    <p className="text-muted-foreground">Live console monitoring and session management.</p>
                </div>
                <Button onClick={startNewSession} size="lg" className="bg-emerald-600 hover:bg-emerald-700 shadow-lg border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all h-14 font-black">
                    <Plus className="mr-2 h-6 w-6" /> START NEW SESSION
                </Button>
            </div>

            {activeSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeSessions.map(s => (
                        <TimerCard key={s.id} session={s} onComplete={fetchData} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-16 border-4 border-dashed rounded-3xl bg-muted/10 opacity-60">
                    <div className="bg-background p-6 rounded-full shadow-inner mb-4">
                        <Gamepad2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <p className="text-xl font-bold text-muted-foreground">No consoles active</p>
                    <p className="text-sm text-muted-foreground mt-1">Start a new session to begin tracking time.</p>
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-2xl font-black flex items-center gap-2">
                    <History className="h-6 w-6 text-primary" /> Session History
                </h2>
                <div className="rounded-2xl border-2 bg-card overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Console ID</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Charge</TableHead>
                                <TableHead>Closing Time</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto opacity-20" /></TableCell>
                                </TableRow>
                            ) : history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic">No recent sessions found.</TableCell>
                                </TableRow>
                            ) : history.map(s => (
                                <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-mono font-bold">#{s.id.slice(-6).toUpperCase()}</TableCell>
                                    <TableCell>{s.duration || 0} min</TableCell>
                                    <TableCell className="font-mono font-bold">{s.cost ? `${s.cost.toFixed(2)} DH` : '-'}</TableCell>
                                    <TableCell className="text-sm">{s.endTime ? new Date(s.endTime).toLocaleString() : '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={s.status === 'COMPLETED' ? 'outline' : 'destructive'} className={cn(
                                            s.status === 'COMPLETED' ? "border-emerald-200 text-emerald-700 bg-emerald-50" : ""
                                        )}>
                                            {s.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
