import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { LogOut, Wallet, TrendingUp, Coins, Shield, Search, Calculator, Download, Filter, SortAsc, SortDesc, Eye, Calendar, Building2, DollarSign, ShoppingCart, CheckCircle, Clock, FileText, Edit, AlertTriangle, XCircle, Settings, X, Tag, Target, Factory, Store, Computer, Wrench, Heart, Banknote, Hammer, Wheat, Trash2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { Security } from "@shared/schema";
import Header from "@/components/Header";
import NotificationCenter from "@/components/NotificationCenter";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import SkeletonCard from "@/components/SkeletonCard";

type SortOption = 'amount-asc' | 'amount-desc' | 'date-asc' | 'date-desc';

export default function InvestorDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('amount-desc');
  const [selectedSecurity, setSelectedSecurity] = useState<Security | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [marketplaceStatusFilter, setMarketplaceStatusFilter] = useState<string>("all");
  const [ownedStatusFilter, setOwnedStatusFilter] = useState<string>("all");
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [watchlistItems, setWatchlistItems] = useState<Security[]>([]);

  // Fetch marketplace securities
  const { data: securities = [], isLoading: securitiesLoading } = useQuery<Security[]>({
    queryKey: ["/api/marketplace/securities"],
    enabled: !!user && user.role === "investor",
    retry: false,
  });

  // Fetch purchased securities
  const { data: purchasedSecurities = [], isLoading: purchasedLoading } = useQuery<Security[]>({
    queryKey: ["/api/investor/securities"],
    enabled: !!user && user.role === "investor",
    retry: false,
  });

  // Fetch watchlist
  const { data: watchlist = [], isLoading: watchlistLoading } = useQuery<Security[]>({
    queryKey: ["/api/watchlist"],
    enabled: !!user && user.role === "investor",
    retry: false,
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (securityId: string) => {
      return await apiRequest("POST", `/api/securities/${securityId}/purchase`);
    },
    onSuccess: () => {
      toast({
        title: "Purchase Successful",
        description: "You have successfully purchased the security!",
      });
      setIsPurchaseModalOpen(false);
      setSelectedSecurity(null);
      // Invalidate both marketplace and purchased securities
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/securities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investor/securities"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase security. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Watchlist mutations
  const addToWatchlistMutation = useMutation({
    mutationFn: async (securityId: string) => {
      return await apiRequest("POST", `/api/watchlist/${securityId}`);
    },
    onSuccess: () => {
      toast({
        title: "Added to Watchlist",
        description: "Security has been added to your watchlist",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add",
        description: error.message || "Failed to add to watchlist",
        variant: "destructive",
      });
    },
  });

  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (securityId: string) => {
      return await apiRequest("DELETE", `/api/watchlist/${securityId}`);
    },
    onSuccess: () => {
      toast({
        title: "Removed from Watchlist",
        description: "Security has been removed from your watchlist",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Remove",
        description: error.message || "Failed to remove from watchlist",
        variant: "destructive",
      });
    },
  });

  const purchaseWatchlistMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/watchlist/purchase");
    },
    onSuccess: (purchasedSecurities) => {
      toast({
        title: "Batch Purchase Successful",
        description: `Successfully purchased ${purchasedSecurities.length} securities`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/securities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investor/securities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      setIsWatchlistModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Batch Purchase Failed",
        description: error.message || "Failed to purchase watchlist items",
        variant: "destructive",
      });
    },
  });

  // Check if security is in watchlist
  const isInWatchlist = (securityId: string) => {
    return watchlist.some(item => item.id === securityId);
  };

  // Calculate total watchlist value
  const watchlistTotal = watchlist.reduce((total, security) => {
    return total + parseFloat(security.totalValue);
  }, 0);



  // Redirect if not authenticated or not an investor
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    
    if (!isLoading && user && user.role !== "investor") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the investor dashboard.",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleViewDetails = (security: Security) => {
    setSelectedSecurity(security);
    setIsDetailsModalOpen(true);
  };

  const handlePurchaseClick = (security: Security) => {
    setSelectedSecurity(security);
    setIsPurchaseModalOpen(true);
  };

  const handleConfirmPurchase = () => {
    if (selectedSecurity) {
      purchaseMutation.mutate(selectedSecurity.id);
    }
  };

  const handleViewAgreement = (security: Security) => {
    setSelectedSecurity(security);
    setIsAgreementModalOpen(true);
  };

  // Helper function to get status badge variant and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "draft":
        return { variant: "secondary" as const, icon: Edit, color: "text-gray-600" };
      case "securitized":
        return { variant: "outline" as const, icon: Shield, color: "text-blue-600" };
      case "listed":
        return { variant: "default" as const, icon: TrendingUp, color: "text-green-600" };
      case "purchased":
        return { variant: "default" as const, icon: CheckCircle, color: "text-blue-600" };
      case "payment_due":
        return { variant: "destructive" as const, icon: AlertTriangle, color: "text-orange-600" };
      case "paid":
        return { variant: "default" as const, icon: CheckCircle, color: "text-green-600" };
      case "cancelled":
        return { variant: "secondary" as const, icon: XCircle, color: "text-red-600" };
      default:
        return { variant: "secondary" as const, icon: Clock, color: "text-gray-600" };
    }
  };

  // Filter marketplace securities
  const filteredMarketplace = marketplaceStatusFilter === "all" 
    ? securities 
    : securities.filter((s: Security) => s.status === marketplaceStatusFilter);

  // Filter owned securities
  const filteredOwnedSecurities = ownedStatusFilter === "all" 
    ? purchasedSecurities 
    : purchasedSecurities.filter((s: Security) => s.status === ownedStatusFilter);

  // Filter and sort securities with advanced filtering
  const filteredAndSortedSecurities = securities
    .filter(security => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          security.title?.toLowerCase().includes(query) ||
          security.description?.toLowerCase().includes(query) ||
          security.debtorName?.toLowerCase().includes(query) ||
          security.merchantName?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && security.category !== categoryFilter) {
        return false;
      }

      // Risk level filter
      if (riskFilter !== 'all' && security.riskLevel !== riskFilter) {
        return false;
      }

      // Currency filter
      if (currencyFilter !== 'all' && security.currency !== currencyFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'amount-asc':
          return parseFloat(a.totalValue) - parseFloat(b.totalValue);
        case 'amount-desc':
          return parseFloat(b.totalValue) - parseFloat(a.totalValue);
        case 'date-asc':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'date-desc':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

  // Get unique values for filters
  const availableCurrencies = Array.from(new Set(securities.map(s => s.currency)));
  const availableCategories = Array.from(new Set(securities.map(s => s.category).filter(Boolean)));
  const availableRiskLevels = Array.from(new Set(securities.map(s => s.riskLevel).filter(Boolean)));

  // Calculate portfolio stats
  const totalInvestmentValue = securities.reduce((sum, s) => sum + parseFloat(s.totalValue), 0);
  const averageReturn = securities.length > 0 
    ? securities.reduce((sum, s) => sum + (parseFloat(s.expectedReturn || '0')), 0) / securities.length 
    : 0;
  
  // Calculate purchased securities stats
  const totalPurchasedValue = purchasedSecurities.reduce((sum, s) => sum + parseFloat(s.totalValue), 0);
  const purchasedCount = purchasedSecurities.length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showNav={false} />
      
      {/* Watchlist Cart Icon */}
      <div className="fixed top-4 right-20 z-50">
        <Button 
          variant="outline" 
          size="icon" 
          className="relative bg-white shadow-lg border-gray-200 hover:bg-gray-50" 
          onClick={() => setIsWatchlistModalOpen(true)}
        >
          <ShoppingCart className="h-5 w-5" />
          {watchlist.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {watchlist.length}
            </span>
          )}
        </Button>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Investor Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Explore new investment opportunities.</p>
            {/* Test Link for Security Detail Page */}
            <div className="mt-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/security/32dea4b8-a921-42b7-a990-0b84c76635bf')}
                className="text-blue-600 hover:text-blue-800 p-0 h-auto"
              >
                🔍 Test Security Detail Page (Click Here!)
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationCenter />
            <Button 
              variant="outline"
              onClick={() => window.location.href = "/profile"}
              className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Profile & Settings
            </Button>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${user?.walletBalance ? parseFloat(user.walletBalance).toLocaleString() : "0.00"}
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-emerald-600">Available for investments</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">My Investments</p>
                  <p className="text-2xl font-bold text-gray-900">${totalPurchasedValue.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">{purchasedCount} securities owned</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Securities</p>
                  <p className="text-2xl font-bold text-gray-900">{securities.length}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Coins className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">Ready to invest</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Return</p>
                  <p className="text-2xl font-bold text-gray-900">{averageReturn.toFixed(1)}%</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">Expected annual return</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Marketplace and Investments Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
              <Tabs defaultValue="marketplace" className="w-full">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                      <TabsTrigger value="purchased">My Securities</TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>
                
                <TabsContent value="marketplace" className="mt-0">
                  <CardHeader>
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold text-gray-900">Available Securities</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                              <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                              <SelectItem value="date-desc">Date (Newest)</SelectItem>
                              <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by title, description, debtor, or merchant..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Advanced Filters */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Filter className="w-4 h-4 mr-2" />
                          Filters:
                        </div>
                        
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger className="w-36">
                            <Tag className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {availableCategories.map(category => (
                              <SelectItem key={category} value={category}>
                                <div className="flex items-center">
                                  {category === 'Manufacturing' && <Factory className="w-4 h-4 mr-2" />}
                                  {category === 'Retail' && <Store className="w-4 h-4 mr-2" />}
                                  {category === 'Technology' && <Computer className="w-4 h-4 mr-2" />}
                                  {category === 'Services' && <Wrench className="w-4 h-4 mr-2" />}
                                  {category === 'Healthcare' && <Heart className="w-4 h-4 mr-2" />}
                                  {category === 'Finance' && <Banknote className="w-4 h-4 mr-2" />}
                                  {category === 'Construction' && <Hammer className="w-4 h-4 mr-2" />}
                                  {category === 'Agriculture' && <Wheat className="w-4 h-4 mr-2" />}
                                  {category}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={riskFilter} onValueChange={setRiskFilter}>
                          <SelectTrigger className="w-32">
                            <Target className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Risk" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Risk</SelectItem>
                            {availableRiskLevels.map(risk => (
                              <SelectItem key={risk} value={risk}>
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    risk === 'Low' ? 'bg-green-500' :
                                    risk === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`} />
                                  {risk} Risk
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                          <SelectTrigger className="w-28">
                            <DollarSign className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {availableCurrencies.map(currency => (
                              <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Clear Filters Button */}
                        {(searchQuery || categoryFilter !== 'all' || riskFilter !== 'all' || currencyFilter !== 'all') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchQuery('');
                              setCategoryFilter('all');
                              setRiskFilter('all');
                              setCurrencyFilter('all');
                            }}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Clear All
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
              <CardContent className="space-y-4">
                {securitiesLoading ? (
                  <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-pulse">
                        {/* Header Skeleton */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100">
                          <div className="flex justify-between items-start mb-3">
                            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                            <div className="h-6 bg-gray-200 rounded-full w-12"></div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                          </div>
                        </div>
                        
                        {/* Content Skeleton */}
                        <div className="p-6">
                          {/* Price Display Skeleton */}
                          <div className="text-center mb-6 py-4 bg-gray-50 rounded-xl">
                            <div className="h-10 bg-gray-200 rounded w-40 mx-auto mb-1"></div>
                            <div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
                            <div className="h-6 bg-gray-200 rounded w-32 mx-auto"></div>
                          </div>
                          
                          {/* Title Skeleton */}
                          <div className="h-6 bg-gray-200 rounded mb-4"></div>
                          <div className="h-6 bg-gray-200 rounded w-3/4 mb-6"></div>
                          
                          {/* Info Boxes Skeleton */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="h-4 bg-gray-200 rounded w-12 mb-1"></div>
                              <div className="h-4 bg-gray-200 rounded w-20"></div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </div>
                          </div>
                          
                          {/* Description Skeleton */}
                          <div className="mb-6 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                          </div>
                          
                          {/* Metadata Skeleton */}
                          <div className="flex justify-between items-center mb-6">
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                          
                          {/* Action Buttons Skeleton */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="h-10 bg-gray-200 rounded"></div>
                            <div className="h-10 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredAndSortedSecurities.length === 0 ? (
                  <EmptyState
                    icon={Shield}
                    title="No Securities Available"
                    description="There are no securities available for purchase at the moment. Check back later for new investment opportunities or adjust your filters."
                    actionLabel="Clear Filters"
                    onAction={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setRiskFilter('all');
                      setCurrencyFilter("all");
                      setMarketplaceStatusFilter("all");
                    }}
                  />
                ) : (
                  <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                    {filteredAndSortedSecurities.map((security: Security) => (
                      <div key={security.id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        {/* Product Header with Status Badge */}
                        <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-2">
                              {(() => {
                                const statusInfo = getStatusInfo(security.status);
                                const StatusIcon = statusInfo.icon;
                                return (
                                  <Badge variant={statusInfo.variant} className="flex items-center space-x-1 shadow-sm">
                                    <StatusIcon className="w-3 h-3" />
                                    <span className="capitalize text-xs font-medium">{security.status.replace('_', ' ')}</span>
                                  </Badge>
                                );
                              })()}
                            </div>
                            {security.riskGrade && (
                              <Badge variant={
                                security.riskGrade.startsWith('A') ? 'default' :
                                security.riskGrade.startsWith('B') ? 'secondary' : 'destructive'
                              } className="text-xs font-bold shadow-sm">
                                {security.riskGrade}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Category & Risk Level Indicators */}
                          <div className="flex items-center space-x-3 mt-3">
                            <div className="flex items-center">
                              {(security as any).category === 'Manufacturing' && <Factory className="w-4 h-4 mr-1 text-blue-600" />}
                              {(security as any).category === 'Retail' && <Store className="w-4 h-4 mr-1 text-purple-600" />}
                              {(security as any).category === 'Technology' && <Computer className="w-4 h-4 mr-1 text-green-600" />}
                              {(security as any).category === 'Services' && <Wrench className="w-4 h-4 mr-1 text-orange-600" />}
                              {(security as any).category === 'Healthcare' && <Heart className="w-4 h-4 mr-1 text-red-600" />}
                              {(security as any).category === 'Finance' && <Banknote className="w-4 h-4 mr-1 text-yellow-600" />}
                              {(security as any).category === 'Construction' && <Hammer className="w-4 h-4 mr-1 text-gray-600" />}
                              {(security as any).category === 'Agriculture' && <Wheat className="w-4 h-4 mr-1 text-green-700" />}
                              <span className="text-xs font-medium text-gray-700">
                                {(security as any).category || 'Services'}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-1 ${
                                (security as any).riskLevel === 'Low' ? 'bg-green-500' :
                                (security as any).riskLevel === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                              <span className={`text-xs font-medium ${
                                (security as any).riskLevel === 'Low' ? 'text-green-700' :
                                (security as any).riskLevel === 'Medium' ? 'text-yellow-700' : 'text-red-700'
                              }`}>
                                {(security as any).riskLevel || 'Medium'} Risk
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Product Content */}
                        <div className="p-6">
                          {/* Amount - Hero Price Display */}
                          <div className="text-center mb-6 py-4 bg-gray-50 rounded-xl">
                            <div className="text-4xl font-bold text-gray-900 mb-1">
                              {security.currency} {parseFloat(security.totalValue).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500 font-medium">Investment Amount</div>
                            {security.expectedReturn && (
                              <div className="mt-2 text-lg font-semibold text-green-600">
                                {security.expectedReturn}% Expected Return
                              </div>
                            )}
                          </div>

                          {/* Security Title */}
                          <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 transition-colors">
                            {security.title}
                          </h3>

                        {/* Key Details Grid */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span className="text-sm">Duration</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{security.duration}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-gray-600">
                              <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                              <span className="text-sm">Expected Return</span>
                            </div>
                            <span className="text-sm font-medium text-green-600">
                              {security.expectedReturn ? `${security.expectedReturn}%` : 'N/A'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-gray-600">
                              <Building2 className="w-4 h-4 mr-2 text-purple-500" />
                              <span className="text-sm">Originator</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {(security as any).merchantName && (security as any).merchantLastName 
                                ? `${(security as any).merchantName} ${(security as any).merchantLastName}`
                                : 'Merchant Inc.'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-gray-600">
                              <FileText className="w-4 h-4 mr-2 text-blue-500" />
                              <span className="text-sm">Debtor</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {(security as any).debtorName || 'Business Client'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-gray-600">
                              <Tag className="w-4 h-4 mr-2 text-indigo-500" />
                              <span className="text-sm">Category</span>
                            </div>
                            <div className="flex items-center">
                              {(security as any).category === 'Manufacturing' && <Factory className="w-3 h-3 mr-1 text-gray-500" />}
                              {(security as any).category === 'Retail' && <Store className="w-3 h-3 mr-1 text-gray-500" />}
                              {(security as any).category === 'Technology' && <Computer className="w-3 h-3 mr-1 text-gray-500" />}
                              {(security as any).category === 'Services' && <Wrench className="w-3 h-3 mr-1 text-gray-500" />}
                              {(security as any).category === 'Healthcare' && <Heart className="w-3 h-3 mr-1 text-gray-500" />}
                              {(security as any).category === 'Finance' && <Banknote className="w-3 h-3 mr-1 text-gray-500" />}
                              {(security as any).category === 'Construction' && <Hammer className="w-3 h-3 mr-1 text-gray-500" />}
                              {(security as any).category === 'Agriculture' && <Wheat className="w-3 h-3 mr-1 text-gray-500" />}
                              <span className="text-sm font-medium text-gray-900">
                                {(security as any).category || 'Services'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-gray-600">
                              <Target className="w-4 h-4 mr-2 text-gray-500" />
                              <span className="text-sm">Risk Level</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                (security as any).riskLevel === 'Low' ? 'bg-green-500' :
                                (security as any).riskLevel === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                              <span className={`text-sm font-medium ${
                                (security as any).riskLevel === 'Low' ? 'text-green-600' :
                                (security as any).riskLevel === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {(security as any).riskLevel || 'Medium'} Risk
                              </span>
                            </div>
                          </div>

                          {(security as any).receivableDueDate && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-gray-600">
                                <Clock className="w-4 h-4 mr-2 text-orange-500" />
                                <span className="text-sm">Due Date</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {format(new Date((security as any).receivableDueDate), "MMM dd, yyyy")}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Description Snippet */}
                        {security.description && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {security.description}
                            </p>
                          </div>
                        )}

                        {/* Listing Date */}
                        <div className="text-xs text-gray-500 mb-4 pb-3 border-b border-gray-100">
                          Listed: {format(new Date(security.listedAt || security.createdAt || new Date()), "MMM dd, yyyy")}
                        </div>

                          {/* E-commerce Style Action Buttons */}
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant="outline"
                              onClick={() => {
                                console.log("Navigating to:", `/security/${security.id}`);
                                setLocation(`/security/${security.id}`);
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-all duration-200"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            
                            {isInWatchlist(security.id) ? (
                              <Button 
                                variant="destructive"
                                onClick={() => removeFromWatchlistMutation.mutate(security.id)}
                                disabled={removeFromWatchlistMutation.isPending}
                                className="text-white shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                {removeFromWatchlistMutation.isPending ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 mr-2" />
                                    In Watchlist
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => addToWatchlistMutation.mutate(security.id)}
                                disabled={addToWatchlistMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                {addToWatchlistMutation.isPending ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add to Cart
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </TabsContent>

                <TabsContent value="purchased" className="mt-0">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-semibold text-gray-900">My Purchased Securities</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <Select value={ownedStatusFilter} onValueChange={setOwnedStatusFilter}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="purchased">Purchased</SelectItem>
                            <SelectItem value="payment_due">Payment Due</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {purchasedLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                      </div>
                    ) : filteredOwnedSecurities.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {ownedStatusFilter === "all" ? "No Securities Purchased" : `No securities with status: ${ownedStatusFilter.replace('_', ' ')}`}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {ownedStatusFilter === "all" ? "Browse the marketplace to find investment opportunities" : "Try changing the filter to see more results"}
                        </p>
                      </div>
                    ) : (
                      filteredOwnedSecurities.map((security: Security) => (
                        <div key={security.id} className="border border-gray-200 rounded-lg p-4 bg-green-50 border-green-200">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-gray-900">{security.title}</h4>
                                <Badge variant="outline">ID: {security.id.slice(0, 8)}</Badge>
                                {(() => {
                                  const statusInfo = getStatusInfo(security.status);
                                  const StatusIcon = statusInfo.icon;
                                  return (
                                    <Badge variant={statusInfo.variant} className="flex items-center space-x-1">
                                      <StatusIcon className="w-3 h-3" />
                                      <span className="capitalize">{security.status.replace('_', ' ')}</span>
                                    </Badge>
                                  );
                                })()}
                                {security.riskGrade && (
                                  <Badge variant={
                                    security.riskGrade.startsWith('A') ? 'default' :
                                    security.riskGrade.startsWith('B') ? 'secondary' : 'destructive'
                                  }>
                                    {security.riskGrade}
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center">
                                  <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                                  <span className="font-medium">{security.currency} {parseFloat(security.totalValue).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center">
                                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                  <span>{security.expectedReturn ? `${security.expectedReturn}%` : 'N/A'} return</span>
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 text-blue-500 mr-1" />
                                  <span>{security.duration}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 text-purple-500 mr-1" />
                                  <span>Purchased: {format(new Date(security.purchasedAt || security.createdAt || new Date()), "MMM dd")}</span>
                                </div>
                              </div>
                              {security.description && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{security.description}</p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(security)}
                                className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewAgreement(security)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                View Agreement
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Investment Tools</h3>
                <div className="space-y-3">
                  <Button 
                    variant="ghost"
                    className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-colors text-left justify-start"
                  >
                    <Search className="w-4 h-4 mr-3" />
                    Browse Marketplace
                  </Button>
                  <Button 
                    variant="ghost"
                    className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-colors text-left justify-start"
                  >
                    <Calculator className="w-4 h-4 mr-3" />
                    ROI Calculator
                  </Button>
                  <Button 
                    variant="ghost"
                    className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-colors text-left justify-start"
                  >
                    <Download className="w-4 h-4 mr-3" />
                    Export Portfolio
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Portfolio Allocation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Technology</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Manufacturing</span>
                    <span className="text-sm font-medium">35%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-success-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Healthcare</span>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-accent-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Security Details Modal */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Security Details</DialogTitle>
              <DialogDescription>
                Complete information about this investment opportunity
              </DialogDescription>
            </DialogHeader>
            {selectedSecurity && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Security Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Security ID:</span>
                        <span className="font-medium">{selectedSecurity.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Title:</span>
                        <span className="font-medium">{selectedSecurity.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Value:</span>
                        <span className="font-medium">{selectedSecurity.currency} {parseFloat(selectedSecurity.totalValue).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Return:</span>
                        <span className="font-medium text-green-600">{selectedSecurity.expectedReturn ? `${selectedSecurity.expectedReturn}%` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Investment Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk Grade:</span>
                        <Badge variant={
                          selectedSecurity.riskGrade?.startsWith('A') ? 'default' :
                          selectedSecurity.riskGrade?.startsWith('B') ? 'secondary' : 'destructive'
                        }>
                          {selectedSecurity.riskGrade || 'Not Rated'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{selectedSecurity.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Merchant:</span>
                        <span className="font-medium">Merchant XYZ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Listed Date:</span>
                        <span className="font-medium">{format(new Date(selectedSecurity.listedAt || selectedSecurity.createdAt || new Date()), "MMM dd, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedSecurity.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{selectedSecurity.description}</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                    Close
                  </Button>
                  <Button className="bg-primary-500 hover:bg-primary-600">
                    Invest Now
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Purchase Confirmation Modal */}
        <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Confirm Purchase</DialogTitle>
              <DialogDescription>
                Are you sure you want to purchase this security?
              </DialogDescription>
            </DialogHeader>
            {selectedSecurity && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">{selectedSecurity.title}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Investment Amount:</span>
                      <p className="font-medium">{selectedSecurity.currency} {parseFloat(selectedSecurity.totalValue).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Expected Return:</span>
                      <p className="font-medium text-green-600">{selectedSecurity.expectedReturn ? `${selectedSecurity.expectedReturn}%` : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <p className="font-medium">{selectedSecurity.duration}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Risk Grade:</span>
                      <Badge variant={
                        selectedSecurity.riskGrade?.startsWith('A') ? 'default' :
                        selectedSecurity.riskGrade?.startsWith('B') ? 'secondary' : 'destructive'
                      }>
                        {selectedSecurity.riskGrade || 'Not Rated'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPurchaseModalOpen(false)}
                    disabled={purchaseMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleConfirmPurchase}
                    disabled={purchaseMutation.isPending}
                    className="bg-primary-500 hover:bg-primary-600"
                  >
                    {purchaseMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Confirm Purchase
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Watchlist Modal */}
        <Dialog open={isWatchlistModalOpen} onOpenChange={setIsWatchlistModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                My Watchlist ({watchlist.length} items)
              </DialogTitle>
              <DialogDescription>
                Review and manage your watchlist items. You can purchase all items at once or remove individual securities.
              </DialogDescription>
            </DialogHeader>

            {watchlist.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="Your watchlist is empty"
                description="Add securities to your watchlist to track them and purchase in bulk."
                actionLabel="Browse Securities"
                onAction={() => setIsWatchlistModalOpen(false)}
              />
            ) : (
              <div className="space-y-4">
                {/* Watchlist Summary */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-blue-900">Watchlist Summary</h3>
                      <p className="text-sm text-blue-700">
                        {watchlist.length} securities • Total value: ${watchlistTotal.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          watchlist.forEach(security => {
                            removeFromWatchlistMutation.mutate(security.id);
                          });
                        }}
                        disabled={removeFromWatchlistMutation.isPending}
                      >
                        Clear All
                      </Button>
                      <Button
                        onClick={() => purchaseWatchlistMutation.mutate()}
                        disabled={purchaseWatchlistMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {purchaseWatchlistMutation.isPending ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          "Purchase All"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Watchlist Items */}
                <div className="grid gap-4">
                  {watchlist.map((security) => (
                    <div key={security.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{security.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {security.riskGrade}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Value:</span>
                              <p className="font-medium">${parseFloat(security.totalValue).toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Return:</span>
                              <p className="font-medium text-green-600">
                                {security.expectedReturn ? `${security.expectedReturn}%` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Duration:</span>
                              <p className="font-medium">{security.duration}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Currency:</span>
                              <p className="font-medium">{security.currency}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromWatchlistMutation.mutate(security.id)}
                          disabled={removeFromWatchlistMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Legal Agreement Modal */}
        <Dialog open={isAgreementModalOpen} onOpenChange={setIsAgreementModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Legal Agreement Placeholder
              </DialogTitle>
              <DialogDescription>
                This document represents a placeholder for a legally binding agreement
              </DialogDescription>
            </DialogHeader>
            {selectedSecurity && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Shield className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Legal Disclaimer
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>This is a placeholder document for demonstration purposes only. In a real-world scenario, this would be a legally binding agreement drafted by qualified legal professionals.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 bg-white">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">TRADE RECEIVABLE SECURITY PURCHASE AGREEMENT</h2>
                    <p className="text-sm text-gray-500 mt-2">[PLACEHOLDER DOCUMENT]</p>
                  </div>

                  <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">PARTIES TO THE AGREEMENT</h3>
                      <p><strong>Merchant (Seller):</strong> {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : '[Merchant Name Placeholder]'}</p>
                      <p><strong>Investor (Purchaser):</strong> {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : '[Investor Name Placeholder]'}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">SECURITY DETAILS</h3>
                      <p><strong>Security ID:</strong> {selectedSecurity.id}</p>
                      <p><strong>Security Title:</strong> {selectedSecurity.title}</p>
                      <p><strong>Total Value:</strong> {selectedSecurity.currency} {parseFloat(selectedSecurity.totalValue).toLocaleString()}</p>
                      <p><strong>Expected Return:</strong> {selectedSecurity.expectedReturn ? `${selectedSecurity.expectedReturn}%` : 'N/A'}</p>
                      <p><strong>Duration:</strong> {selectedSecurity.duration}</p>
                      <p><strong>Risk Grade:</strong> {selectedSecurity.riskGrade || 'Not Rated'}</p>
                      <p><strong>Purchase Date:</strong> {format(new Date(selectedSecurity.purchasedAt || new Date()), "MMMM dd, yyyy")}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">AGREEMENT TERMS</h3>
                      <p>This document represents a placeholder for a legally binding agreement between the above-mentioned parties for the purchase of Trade Receivable Security ID {selectedSecurity.id}.</p>
                      
                      <p className="mt-3">In a real-world scenario, this agreement would include:</p>
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        <li>Detailed terms and conditions of the security purchase</li>
                        <li>Rights and obligations of both parties</li>
                        <li>Payment terms and settlement procedures</li>
                        <li>Risk disclosure and investor protections</li>
                        <li>Dispute resolution mechanisms</li>
                        <li>Regulatory compliance requirements</li>
                        <li>Legal enforceability provisions</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">LEGAL NOTICE</h3>
                      <p className="text-red-600 font-medium">This is a demonstration placeholder only. Any actual legal agreement would require:</p>
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-red-600">
                        <li>Professional legal review and drafting</li>
                        <li>Compliance with applicable securities laws</li>
                        <li>Proper notarization and witnessing</li>
                        <li>Regulatory approval where required</li>
                      </ul>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-6">
                      <p className="text-xs text-gray-500 text-center">
                        Document Generated: {format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}<br/>
                        Security Reference: {selectedSecurity.id}<br/>
                        Platform: SecureReceivables Demo System
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAgreementModalOpen(false)}
                  >
                    Close Agreement
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
