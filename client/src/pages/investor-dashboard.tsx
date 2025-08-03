import { useEffect, useState } from "react";
import { LogOut, Wallet, TrendingUp, Coins, Shield, Search, Calculator, Download, Filter, SortAsc, SortDesc, Eye, Calendar, Building2, DollarSign, ShoppingCart, CheckCircle, Clock, FileText, Edit, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { Security } from "@shared/schema";
import Header from "@/components/Header";

type SortOption = 'amount-asc' | 'amount-desc' | 'date-asc' | 'date-desc';

export default function InvestorDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('amount-desc');
  const [selectedSecurity, setSelectedSecurity] = useState<Security | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [marketplaceStatusFilter, setMarketplaceStatusFilter] = useState<string>("all");
  const [ownedStatusFilter, setOwnedStatusFilter] = useState<string>("all");

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
    ? marketplacePaged 
    : marketplacePaged.filter(s => s.status === marketplaceStatusFilter);

  // Filter owned securities
  const filteredOwnedSecurities = ownedStatusFilter === "all" 
    ? ownedSecurities 
    : ownedSecurities.filter(s => s.status === ownedStatusFilter);

  // Filter and sort securities
  const filteredAndSortedSecurities = securities
    .filter(security => currencyFilter === 'all' || security.currency === currencyFilter)
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

  // Get unique currencies
  const availableCurrencies = Array.from(new Set(securities.map(s => s.currency)));

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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Investor Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Explore new investment opportunities.</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Market Value</p>
                  <p className="text-2xl font-bold text-gray-900">${totalInvestmentValue.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">{securities.length} securities available</span>
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
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-semibold text-gray-900">Available Securities</CardTitle>
                  <div className="flex items-center space-x-4">
                    {/* Currency Filter */}
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {availableCurrencies.map(currency => (
                            <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Status Filter */}
                    <div className="flex items-center space-x-2">
                      <Select value={marketplaceStatusFilter} onValueChange={setMarketplaceStatusFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="listed">Listed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort Options */}
                    <div className="flex items-center space-x-2">
                      <SortAsc className="w-4 h-4 text-gray-500" />
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
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {securitiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : filteredMarketplace.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Securities Available</h3>
                    <p className="text-sm text-gray-500">Check back later for new investment opportunities</p>
                  </div>
                ) : (
                  filteredMarketplace.map((security) => (
                    <div key={security.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors">
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
                              <Building2 className="w-4 h-4 text-purple-500 mr-1" />
                              <span>Merchant XYZ</span>
                            </div>
                          </div>
                          {security.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{security.description}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(security)}
                          className="ml-4 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handlePurchaseClick(security)}
                          className="ml-2 bg-primary-500 hover:bg-primary-600 text-white"
                          disabled={purchaseMutation.isPending}
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Purchase
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <span>Listed: {format(new Date(security.listedAt || security.createdAt || new Date()), "MMM dd, yyyy")}</span>
                        <span>Status: Listed</span>
                      </div>
                    </div>
                  ))
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
                      filteredOwnedSecurities.map((security) => (
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
