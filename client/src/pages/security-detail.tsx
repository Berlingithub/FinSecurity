import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Shield, TrendingUp, Calendar, Building2, FileText, DollarSign, Tag, Target, Clock, Star, MessageCircle, Plus, Check, Eye, Factory, Store, Computer, Wrench, Heart, Banknote, Hammer, Wheat, User, ChevronDown, ChevronUp, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Security } from "@shared/schema";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SecurityDetailPage() {
  const [, params] = useRoute("/security/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [expandedQA, setExpandedQA] = useState<number | null>(null);

  const securityId = params?.id;

  // Fetch security details
  const { data: security, isLoading } = useQuery<Security>({
    queryKey: ["/api/security", securityId],
    queryFn: async () => {
      const marketplaceSecurities = await apiRequest("GET", "/api/marketplace/securities");
      const foundSecurity = marketplaceSecurities.find((s: Security) => s.id === securityId);
      if (!foundSecurity) {
        throw new Error("Security not found");
      }
      return foundSecurity;
    },
    enabled: !!securityId,
    retry: false,
  });

  // Fetch watchlist
  const { data: watchlist = [] } = useQuery<Security[]>({
    queryKey: ["/api/watchlist"],
    enabled: !!user && user.role === "investor",
    retry: false,
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

  // Check if security is in watchlist
  const isInWatchlist = (securityId: string) => {
    return watchlist.some(item => item.id === securityId);
  };

  // Calculate days to maturity
  const calculateDaysToMaturity = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Manufacturing': return Factory;
      case 'Retail': return Store;
      case 'Technology': return Computer;
      case 'Services': return Wrench;
      case 'Healthcare': return Heart;
      case 'Finance': return Banknote;
      case 'Construction': return Hammer;
      case 'Agriculture': return Wheat;
      default: return Building2;
    }
  };

  // Mock Q&A data
  const mockQAData = [
    {
      id: 1,
      question: "Is this suitable for short-term investment?",
      answer: "Yes, this security has a maturity period that makes it suitable for short-term investment strategies. The expected return timeline aligns well with short-term portfolio goals.",
      author: "InvestorPro",
      date: "2025-01-15",
      helpful: 12
    },
    {
      id: 2,
      question: "What happens if the debtor defaults?",
      answer: "This security includes standard risk mitigation measures. While all investments carry risk, the merchant has provided appropriate collateral and has a strong payment history. Review the full legal agreement for complete terms.",
      author: "RiskAnalyst",
      date: "2025-01-10",
      helpful: 8
    },
    {
      id: 3,
      question: "How is the expected return calculated?",
      answer: "The expected return is based on the receivable amount, payment timeline, and associated fees. This represents an annualized return based on the security's duration and risk profile.",
      author: "FinanceExpert",
      date: "2025-01-08",
      helpful: 15
    }
  ];

  // Mock reviews data
  const mockReviews = [
    {
      id: 1,
      rating: 5,
      title: "Excellent short-term investment",
      content: "Great return rate and reliable merchant. Payment was received exactly on time. Would invest in similar securities again.",
      author: "TechInvestor",
      date: "2025-01-12",
      verified: true
    },
    {
      id: 2,
      rating: 4,
      title: "Good diversification option",
      content: "Added nice diversity to my portfolio. The technology sector exposure was exactly what I was looking for.",
      author: "PortfolioBuilder",
      date: "2025-01-05",
      verified: true
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showNav={false} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!security) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showNav={false} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Security Not Found</h1>
            <Button onClick={() => setLocation("/investor-dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(security.category || 'Services');
  const daysToMaturity = security.receivableDueDate ? calculateDaysToMaturity(security.receivableDueDate) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showNav={false} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/investor-dashboard")}
            className="p-0 h-auto text-blue-600 hover:text-blue-800"
          >
            Marketplace
          </Button>
          <span>/</span>
          <span className="text-gray-900 font-medium">Security Details</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Security Header */}
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
              <CardContent className="p-8">
                {/* Category & Risk Level Badge */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                    <CategoryIcon className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">{security.category || 'Services'}</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      security.riskLevel === 'Low' ? 'bg-green-500' :
                      security.riskLevel === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      security.riskLevel === 'Low' ? 'text-green-700' :
                      security.riskLevel === 'Medium' ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {security.riskLevel || 'Medium'} Risk
                    </span>
                  </div>
                  {security.riskGrade && (
                    <Badge variant={
                      security.riskGrade.startsWith('A') ? 'default' :
                      security.riskGrade.startsWith('B') ? 'secondary' : 'destructive'
                    }>
                      Grade {security.riskGrade}
                    </Badge>
                  )}
                </div>

                {/* Security Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                  {security.title}
                </h1>

                {/* Key Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-sm text-green-700 font-medium">Expected Return</p>
                        <p className="text-xl font-bold text-green-800">
                          {security.expectedReturn ? `${security.expectedReturn}%` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-blue-600 mr-2" />
                      <div>
                        <p className="text-sm text-blue-700 font-medium">Duration</p>
                        <p className="text-xl font-bold text-blue-800">{security.duration}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-purple-600 mr-2" />
                      <div>
                        <p className="text-sm text-purple-700 font-medium">Days to Maturity</p>
                        <p className="text-xl font-bold text-purple-800">
                          {daysToMaturity !== null ? `${daysToMaturity} days` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {security.description && (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">{security.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Information */}
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="w-5 h-5 mr-2 text-blue-600" />
                  Security Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Investment Amount</span>
                      <span className="text-lg font-bold text-gray-900">
                        {security.currency} {parseFloat(security.totalValue).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Currency</span>
                      <span className="font-semibold text-gray-900">{security.currency}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Risk Grade</span>
                      <Badge variant={
                        security.riskGrade?.startsWith('A') ? 'default' :
                        security.riskGrade?.startsWith('B') ? 'secondary' : 'destructive'
                      }>
                        {security.riskGrade || 'Not Rated'}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Duration</span>
                      <span className="font-semibold text-gray-900">{security.duration}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Debtor</span>
                      <span className="font-semibold text-gray-900">
                        {security.debtorName || 'Business Client'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Merchant</span>
                      <span className="font-semibold text-gray-900">
                        {security.merchantName && security.merchantLastName 
                          ? `${security.merchantName} ${security.merchantLastName}`
                          : 'Merchant Inc.'}
                      </span>
                    </div>
                    
                    {security.receivableDueDate && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Due Date</span>
                        <span className="font-semibold text-gray-900">
                          {format(new Date(security.receivableDueDate), "MMM dd, yyyy")}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Listed Date</span>
                      <span className="font-semibold text-gray-900">
                        {format(new Date(security.listedAt || security.createdAt || new Date()), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legal Agreement Section */}
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Legal Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-1">Legal Agreement Preview</h4>
                      <p className="text-sm text-yellow-700 mb-3">
                        This document represents a placeholder for a legally binding agreement between parties for the purchase of Trade Receivable Security. In a real-world scenario, this would include detailed terms and conditions, rights and obligations of both parties, payment terms, risk disclosures, and regulatory compliance requirements.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsAgreementModalOpen(true)}
                        className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Legal Agreement
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions & Answers Section */}
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                  Questions & Answers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockQAData.map((qa, index) => (
                    <div key={qa.id} className="border border-gray-200 rounded-lg p-4">
                      <div 
                        className="cursor-pointer"
                        onClick={() => setExpandedQA(expandedQA === index ? null : index)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-gray-900 mb-2 flex-1">{qa.question}</h4>
                          {expandedQA === index ? (
                            <ChevronUp className="w-5 h-5 text-gray-500 ml-2" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 ml-2" />
                          )}
                        </div>
                      </div>
                      
                      {expandedQA === index && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-gray-700 mb-3">{qa.answer}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span>By {qa.author}</span>
                              <span>{format(new Date(qa.date), "MMM dd, yyyy")}</span>
                            </div>
                            <span>{qa.helpful} people found this helpful</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Investor Reviews Section */}
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Investor Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockReviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold text-gray-900">{review.title}</span>
                        {review.verified && (
                          <Badge variant="outline" className="text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-700 mb-3">{review.content}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {review.author}
                        </div>
                        <span>{format(new Date(review.date), "MMM dd, yyyy")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Investment Summary Card */}
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {security.currency} {parseFloat(security.totalValue).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Investment Amount</div>
                    {security.expectedReturn && (
                      <div className="mt-2">
                        <span className="text-lg font-semibold text-green-600">
                          {security.expectedReturn}% Expected Return
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Key Metrics */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{security.duration}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Risk Grade</span>
                      <span className="font-medium">{security.riskGrade || 'Not Rated'}</span>
                    </div>
                    {daysToMaturity !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Days to Maturity</span>
                        <span className="font-medium">{daysToMaturity} days</span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Call to Action */}
                  {isInWatchlist(security.id) ? (
                    <Button 
                      variant="destructive"
                      className="w-full mb-3"
                      onClick={() => removeFromWatchlistMutation.mutate(security.id)}
                      disabled={removeFromWatchlistMutation.isPending}
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
                      className="w-full mb-3 bg-green-600 hover:bg-green-700"
                      onClick={() => addToWatchlistMutation.mutate(security.id)}
                      disabled={addToWatchlistMutation.isPending}
                    >
                      {addToWatchlistMutation.isPending ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Watchlist
                        </>
                      )}
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setLocation("/investor-dashboard")}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Marketplace
                  </Button>
                </CardContent>
              </Card>

              {/* Security Info Card */}
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Security Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Security ID</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {security.id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <Badge variant="default">Listed</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Category</span>
                    <div className="flex items-center">
                      <CategoryIcon className="w-3 h-3 mr-1" />
                      <span className="text-xs">{security.category || 'Services'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

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
                    <p><strong>Merchant (Seller):</strong> {security.merchantName && security.merchantLastName 
                      ? `${security.merchantName} ${security.merchantLastName}`
                      : '[Merchant Name Placeholder]'}</p>
                    <p><strong>Investor (Purchaser):</strong> {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : '[Investor Name Placeholder]'}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">SECURITY DETAILS</h3>
                    <p><strong>Security ID:</strong> {security.id}</p>
                    <p><strong>Security Title:</strong> {security.title}</p>
                    <p><strong>Total Value:</strong> {security.currency} {parseFloat(security.totalValue).toLocaleString()}</p>
                    <p><strong>Expected Return:</strong> {security.expectedReturn ? `${security.expectedReturn}%` : 'N/A'}</p>
                    <p><strong>Duration:</strong> {security.duration}</p>
                    <p><strong>Risk Grade:</strong> {security.riskGrade || 'Not Rated'}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">AGREEMENT TERMS</h3>
                    <p>This document represents a placeholder for a legally binding agreement between the above-mentioned parties for the purchase of Trade Receivable Security ID {security.id}.</p>
                    
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
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}