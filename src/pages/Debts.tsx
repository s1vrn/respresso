import React, { useState, useEffect } from "react"
import { User } from "../types/electron"
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
    Search,
    CreditCard,
    UserPlus,
    History,
    Loader2,
    TrendingDown
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export const Debts: React.FC = () => {
    const [clients, setClients] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Form states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isPayOpen, setIsPayOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState<User | null>(null)
    const [newClientName, setNewClientName] = useState("")
    const [paymentAmount, setPaymentAmount] = useState("")

    const fetchClients = async () => {
        setLoading(true)
        const result = await window.api.getAllUsers()
        if (result.success && result.users) {
            setClients(result.users.filter(u => u.role === 'CLIENT'))
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchClients()
    }, [])

    const handleCreateClient = async () => {
        if (!newClientName) return

        const result = await window.api.createUser({
            name: newClientName,
            password: 'password_reset_me', // Default password for clients if ever needed
            role: 'CLIENT'
        })

        if (result.success) {
            setIsAddOpen(false)
            setNewClientName("")
            fetchClients()
        } else {
            alert("Error: " + result.error)
        }
    }

    const handlePayDebt = async () => {
        if (!selectedClient || !paymentAmount) return

        const amount = parseFloat(paymentAmount)
        const result = await window.api.addDebtPayment({
            userId: selectedClient.id,
            amount: amount
        })

        if (result.success) {
            setIsPayOpen(false)
            setPaymentAmount("")
            setSelectedClient(null)
            fetchClients()
        } else {
            alert("Error: " + result.error)
        }
    }

    const totalDebt = clients.reduce((acc, curr) => acc + curr.balance, 0)

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.balance - a.balance)

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Clients & Debts</h1>
                    <p className="text-muted-foreground">Manage client accounts and outstanding balances.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="font-bold">
                                <UserPlus className="h-4 w-4 mr-2" /> Add Client
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Register New Client</DialogTitle>
                                <DialogDescription>Create a new account for credit management.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. John Doe"
                                        value={newClientName}
                                        onChange={e => setNewClientName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateClient}>Register</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-destructive/10 border-destructive/20 shadow-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-destructive uppercase tracking-wider">Total Outstanding</span>
                            <TrendingDown className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="text-3xl font-black text-destructive">{totalDebt.toFixed(2)} DH</div>
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardContent className="pt-6 flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground text-center italic">
                            Recent debt activities and payment trends will be implemented here.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-card rounded-2xl border-2 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[300px]">Client Name</TableHead>
                            <TableHead>Account Status</TableHead>
                            <TableHead>Balance Due</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-40 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                                    No clients found.
                                </TableCell>
                            </TableRow>
                        ) : filteredClients.map((client) => (
                            <TableRow key={client.id} className="hover:bg-muted/30 transition-colors group">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold">{client.name}</span>
                                        <span className="text-xs text-muted-foreground font-mono">{client.id.slice(-8).toUpperCase()}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {client.balance > 0 ? (
                                        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10">In Debt</Badge>
                                    ) : (
                                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Balanced</Badge>
                                    )}
                                </TableCell>
                                <TableCell className={cn(
                                    "font-mono font-black text-lg",
                                    client.balance > 0 ? "text-destructive" : "text-emerald-600"
                                )}>
                                    {client.balance.toFixed(2)} DH
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {client.balance > 0 && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-9 px-4 font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                                                onClick={() => {
                                                    setSelectedClient(client)
                                                    setIsPayOpen(true)
                                                }}
                                            >
                                                <CreditCard className="h-4 w-4 mr-2" /> Record Payment
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-muted-foreground"
                                            onClick={() => {/* View history */ }}
                                        >
                                            <History className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pay Debt Dialog */}
            <Dialog open={isPayOpen} onOpenChange={(val: boolean) => {
                setIsPayOpen(val)
                if (!val) setSelectedClient(null)
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Debt Payment</DialogTitle>
                        <DialogDescription>
                            Client: <span className="font-bold text-foreground">{selectedClient?.name}</span><br />
                            Current Debt: <span className="font-bold text-destructive">{selectedClient?.balance.toFixed(2)} DH</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="pay-amt">Payment Amount (DH)</Label>
                            <div className="relative">
                                <Input
                                    id="pay-amt"
                                    type="number"
                                    placeholder="e.g. 50.00"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    className="pr-12 text-lg font-bold"
                                    autoFocus
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">DH</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={() => setPaymentAmount(selectedClient?.balance.toString() || "")}
                            >
                                Pay Full Debt
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={() => setPaymentAmount((selectedClient?.balance ? selectedClient.balance / 2 : 0).toString())}
                            >
                                Pay Half
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPayOpen(false)}>Cancel</Button>
                        <Button onClick={handlePayDebt} className="bg-emerald-600 hover:bg-emerald-700">Submit Payment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
