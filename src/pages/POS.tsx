import React, { useState, useEffect } from "react"
import { Product, User } from "../types/electron"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Trash2, CreditCard, Wallet, Plus, Minus, Search, Coffee, Utensils, Briefcase, ShoppingBag, Loader2, CheckCircle } from "lucide-react"
import { useAuth } from "@/providers/AuthProvider"
import { cn } from "@/lib/utils"

type CartItem = Product & { cartQuantity: number }

export const POS: React.FC = () => {
    const { user: currentUser } = useAuth()
    const [products, setProducts] = useState<Product[]>([])
    const [clients, setClients] = useState<User[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedClient, setSelectedClient] = useState<string>("guest")
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeCategory, setActiveCategory] = useState("ALL")
    const [orderSuccess, setOrderSuccess] = useState(false)

    const fetchData = async () => {
        setFetching(true)
        const [prodResult, userResult] = await Promise.all([
            window.api.getAllProducts(),
            window.api.getAllUsers()
        ])
        if (prodResult.success && prodResult.products) setProducts(prodResult.products)
        if (userResult.success && userResult.users) {
            setClients(userResult.users.filter(u => u.role === 'CLIENT'))
        }
        setFetching(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id)
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, cartQuantity: p.cartQuantity + 1 } : p)
            }
            return [...prev, { ...product, cartQuantity: 1 }]
        })
    }

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(p => p.id !== id))
    }

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(p => {
            if (p.id === id) {
                const newQ = p.cartQuantity + delta
                return newQ > 0 ? { ...p, cartQuantity: newQ } : p
            }
            return p
        }))
    }

    const total = cart.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0)

    const handleCheckout = async (isPaid: boolean) => {
        if (cart.length === 0) return

        if (!isPaid && selectedClient === 'guest') {
            alert("Cannot charge debt to Guest. Please select a client.")
            return
        }

        setLoading(true)
        const items = cart.map(p => ({
            productId: p.id,
            quantity: p.cartQuantity,
            price: p.price
        }))

        const result = await window.api.createOrder({
            userId: selectedClient === 'guest' ? undefined : selectedClient,
            staffId: currentUser?.id,
            total,
            isPaid,
            items
        })

        if (result.success) {
            setCart([])
            if (isPaid) setSelectedClient("guest")
            setOrderSuccess(true)
            setTimeout(() => setOrderSuccess(false), 3000)
            fetchData() // Refresh stock
        } else {
            alert("Error processing order: " + result.error)
        }
        setLoading(false)
    }

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = activeCategory === "ALL" || p.type === activeCategory
        return matchesSearch && matchesCategory
    })

    if (fetching && products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading POS System...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>
                    <p className="text-muted-foreground text-sm">Create orders and manage customer transactions.</p>
                </div>
                {orderSuccess && (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 animate-in slide-in-from-right-4">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Order successful!</span>
                    </div>
                )}
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Main Content: Products */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {/* Search and Categories */}
                    <div className="flex gap-4 items-center bg-card p-3 rounded-xl border shadow-sm">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10"
                            />
                        </div>

                        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1">
                            <TabsList className="grid w-full grid-cols-4 max-w-[500px]">
                                <TabsTrigger value="ALL">All</TabsTrigger>
                                <TabsTrigger value="SNACK">Snacks</TabsTrigger>
                                <TabsTrigger value="DRINK">Drinks</TabsTrigger>
                                <TabsTrigger value="SERVICE">Services</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Product Grid */}
                    <ScrollArea className="flex-1 rounded-xl border bg-muted/20 p-4 shadow-inner">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                            {filteredProducts.map(product => (
                                <Card
                                    key={product.id}
                                    className={cn(
                                        "cursor-pointer hover:shadow-lg hover:border-primary transition-all active:scale-95 group relative overflow-hidden border-2",
                                        product.type !== 'SERVICE' && (product.stock || 0) <= 0 ? 'opacity-60 grayscale bg-muted/50 cursor-not-allowed' : 'bg-card'
                                    )}
                                    onClick={() => {
                                        if (product.type !== 'SERVICE' && (product.stock || 0) <= 0) return
                                        addToCart(product)
                                    }}
                                >
                                    <CardContent className="p-4 flex flex-col justify-between min-h-[160px]">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                                            {product.type === 'DRINK' && <Coffee className="h-5 w-5 text-blue-500/50" />}
                                            {product.type === 'SNACK' && <Utensils className="h-5 w-5 text-orange-500/50" />}
                                            {product.type === 'SERVICE' && <Briefcase className="h-5 w-5 text-purple-500/50" />}
                                        </div>

                                        <div className="space-y-1 mt-auto">
                                            <div className="text-2xl font-black text-primary">
                                                {product.price} <span className="text-xs font-normal text-muted-foreground uppercase tracking-widest ml-0.5">DH</span>
                                            </div>
                                            <div className={cn(
                                                "text-xs font-medium",
                                                product.type === 'SERVICE' ? 'text-purple-600' :
                                                    (product.stock || 0) <= 0 ? 'text-destructive' : 'text-muted-foreground'
                                            )}>
                                                {product.type === 'SERVICE' ? 'Unlimited Service' : `In Stock: ${product.stock}`}
                                            </div>
                                        </div>

                                        {product.type !== 'SERVICE' && (product.stock || 0) <= 0 && (
                                            <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-[2px]">
                                                <Badge variant="destructive" className="rotate-12 shadow-lg border-2 border-background font-bold px-3 py-1">SOLD OUT</Badge>
                                            </div>
                                        )}

                                        <div className="absolute top-2 right-2 bg-primary/10 text-primary p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus className="h-4 w-4" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Right Sidebar: Cart */}
                <div className="w-[400px] flex flex-col border-2 rounded-2xl bg-card shadow-2xl overflow-hidden h-full">
                    {/* Cart Header */}
                    <div className="p-5 bg-muted/30 border-b space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-black text-xl flex items-center gap-3">
                                <ShoppingBag className="h-6 w-6 text-primary" /> Cart
                            </h2>
                            <Badge variant="default" className="rounded-full px-3">{cart.reduce((a, c) => a + c.cartQuantity, 0)} Items</Badge>
                        </div>

                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                            <SelectTrigger className="w-full bg-background border-2 h-11">
                                <SelectValue placeholder="Select Client" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                <SelectItem value="guest">Guest (Fast Cash)</SelectItem>
                                {clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>
                                        <div className="flex justify-between w-full gap-4">
                                            <span>{client.name}</span>
                                            {client.balance > 0 && <span className="text-destructive text-xs font-bold font-mono">-{client.balance} DH</span>}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cart Items */}
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-3">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-60 text-muted-foreground opacity-30 gap-4 mt-10">
                                    <ShoppingCart className="h-20 w-20" />
                                    <p className="font-bold text-lg">Your cart is empty</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl border-2 border-transparent hover:border-muted hover:bg-muted/30 transition-all group">
                                        {/* Qty Controls */}
                                        <div className="flex flex-col items-center gap-1 bg-background border-2 rounded-xl p-1 shadow-sm">
                                            <button
                                                className="h-6 w-6 flex items-center justify-center hover:bg-primary hover:text-white rounded-lg transition-colors"
                                                onClick={() => updateQuantity(item.id, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                            <span className="text-sm font-black w-6 text-center">{item.cartQuantity}</span>
                                            <button
                                                className="h-6 w-6 flex items-center justify-center hover:bg-destructive hover:text-white rounded-lg transition-colors"
                                                onClick={() => updateQuantity(item.id, -1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                        </div>

                                        {/* Item Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm truncate">{item.name}</div>
                                            <div className="text-xs font-mono text-muted-foreground">
                                                {item.price.toFixed(2)} DH
                                            </div>
                                        </div>

                                        {/* Line Total */}
                                        <div className="font-black text-base text-primary">
                                            {(item.price * item.cartQuantity).toFixed(2)}
                                        </div>

                                        {/* Remove */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeFromCart(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    {/* Checkout Footer */}
                    <div className="p-6 bg-card border-t-2 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-muted-foreground font-medium">Grand Total</span>
                            <div className="text-4xl font-black text-primary">
                                {total.toFixed(2)}
                                <span className="text-sm font-normal text-muted-foreground ml-1">DH</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                className="h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xl border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all"
                                disabled={loading || cart.length === 0}
                                onClick={() => handleCheckout(true)}
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Wallet className="mr-2 h-6 w-6" />}
                                CASH
                            </Button>
                            <Button
                                className="h-14 text-lg font-bold shadow-xl border-b-4 border-slate-800 active:border-b-0 active:translate-y-1 transition-all"
                                variant="destructive"
                                disabled={loading || cart.length === 0 || selectedClient === 'guest'}
                                onClick={() => handleCheckout(false)}
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <CreditCard className="mr-2 h-6 w-6" />}
                                DEBT
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
