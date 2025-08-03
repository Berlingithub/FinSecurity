import { useEffect, useState } from "react";
import { LogOut, FileText, Shield, Layers, Star, Receipt, Plus, BarChart, Settings, Calendar, DollarSign, Trash2, Edit, Lock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { createReceivableSchema, createSecuritySchema, type CreateReceivable, type CreateSecurity, type Receivable, type Security } from "@shared/schema";
import { format } from "date-fns";
import Header from "@/components/Header";

export default function MerchantDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSecuritizeModalOpen, setIsSecuritizeModalOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);

  const form = useForm<CreateReceivable>({
    resolver: zodResolver(createReceivableSchema),
    defaultValues: {
      debtorName: "",
      amount: "",
      currency: "USD",
      dueDate: "",
      description: "",
    },
  });

  const securitizeForm = useForm<CreateSecurity>({
    resolver: zodResolver(createSecuritySchema),
    defaultValues: {
      title: "",
      description: "",
      totalValue: "",
      expectedReturn: "",
      riskGrade: "B",
      duration: "",
    },
  });

  // Fetch receivables
  const { data: receivables = [], isLoading: receivablesLoading } = useQuery<Receivable[]>({
    queryKey: ["/api/receivables"],
    enabled: !!user && user.role === "merchant",
    retry: false,
  });

  // Fetch securities
  const { data: securities = [], isLoading: securitiesLoading } = useQuery<Security[]>({
    queryKey: ["/api/securities"],
    enabled: !!user && user.role === "merchant",
    retry: false,
  });

  // Create receivable mutation
  const createReceivableMutation = useMutation({
    mutationFn: async (data: CreateReceivable) => {
      const response = await apiRequest("POST", "/api/receivables", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Receivable created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/receivables"] });
      setIsAddModalOpen(false);
      form.reset();
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
        title: "Error",
        description: error.message || "Failed to create receivable. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete receivable mutation
  const deleteReceivableMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/receivables/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Receivable deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/receivables"] });
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
        title: "Error",
        description: error.message || "Failed to delete receivable. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Securitize receivable mutation
  const securitizeMutation = useMutation({
    mutationFn: async ({ receivableId, data }: { receivableId: string; data: CreateSecurity }) => {
      const response = await apiRequest("POST", `/api/securities/securitize/${receivableId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Receivable securitized successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/receivables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/securities"] });
      setIsSecuritizeModalOpen(false);
      setSelectedReceivable(null);
      securitizeForm.reset();
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
        title: "Error",
        description: error.message || "Failed to securitize receivable. Please try again.",
        variant: "destructive",
      });
    },
  });

  // List security mutation
  const listSecurityMutation = useMutation({
    mutationFn: async (securityId: string) => {
      const response = await apiRequest("POST", `/api/securities/${securityId}/list`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Security listed on marketplace successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/receivables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/securities"] });
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
        title: "Error",
        description: error.message || "Failed to list security. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateReceivable) => {
    createReceivableMutation.mutate(data);
  };

  const onSecuritizeSubmit = (data: CreateSecurity) => {
    if (!selectedReceivable) return;
    securitizeMutation.mutate({ receivableId: selectedReceivable.id, data });
  };

  const handleDeleteReceivable = (id: string) => {
    if (confirm("Are you sure you want to delete this receivable?")) {
      deleteReceivableMutation.mutate(id);
    }
  };

  const handleSecuritize = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    // Pre-fill form with receivable data
    securitizeForm.setValue("title", `${receivable.debtorName} Trade Receivable`);
    securitizeForm.setValue("totalValue", receivable.amount);
    securitizeForm.setValue("description", receivable.description || `Trade receivable from ${receivable.debtorName} due ${format(new Date(receivable.dueDate), "MMM dd, yyyy")}`);
    setIsSecuritizeModalOpen(true);
  };

  const handleListSecurity = (securityId: string) => {
    if (confirm("Are you sure you want to list this security on the marketplace? This action cannot be undone.")) {
      listSecurityMutation.mutate(securityId);
    }
  };

  // Find security for receivable
  const getSecurityForReceivable = (receivableId: string) => {
    return securities.find(s => s.receivableId === receivableId);
  };

  // Calculate totals
  const totalReceivables = receivables.reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const activeReceivables = receivables.filter(r => r.status === "draft" || r.status === "active").length;
  const securitizedAmount = receivables
    .filter(r => r.status === "securitized" || r.status === "listed")
    .reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const listedSecurities = securities.filter(s => s.status === "listed").length;

  // Redirect if not authenticated or not a merchant
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
    
    if (!isLoading && user && user.role !== "merchant") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the merchant dashboard.",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Merchant Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Ready to securitize your receivables?</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Receivables</p>
                  <p className="text-2xl font-bold text-gray-900">${totalReceivables.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">{receivables.length} total receivables</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Securitized Amount</p>
                  <p className="text-2xl font-bold text-gray-900">${securitizedAmount.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-success-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">{receivables.filter(r => r.status === "securitized").length} securitized</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Receivables</p>
                  <p className="text-2xl font-bold text-gray-900">{activeReceivables}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-accent-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">Available for securitization</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Listed Securities</p>
                  <p className="text-2xl font-bold text-gray-900">{listedSecurities}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">On marketplace</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Your Receivables</CardTitle>
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Receivable
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Receivable</DialogTitle>
                      <DialogDescription>
                        Create a new trade receivable for securitization.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="debtorName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Debtor Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Company or individual name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                    <SelectItem value="INR">INR</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Additional notes about this receivable" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-primary-500 hover:bg-primary-600"
                          disabled={createReceivableMutation.isPending}
                        >
                          {createReceivableMutation.isPending ? "Creating..." : "Create Receivable"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              
              {/* Securitization Modal */}
              <Dialog open={isSecuritizeModalOpen} onOpenChange={setIsSecuritizeModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Securitize Receivable</DialogTitle>
                    <DialogDescription>
                      Convert your receivable into a tradeable security for the marketplace.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...securitizeForm}>
                    <form onSubmit={securitizeForm.handleSubmit(onSecuritizeSubmit)} className="space-y-4">
                      <FormField
                        control={securitizeForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Security Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Descriptive title for investors" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={securitizeForm.control}
                          name="totalValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Value</FormLabel>
                              <FormControl>
                                <Input placeholder="0.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={securitizeForm.control}
                          name="expectedReturn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expected Return (%)</FormLabel>
                              <FormControl>
                                <Input placeholder="5.5" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={securitizeForm.control}
                          name="riskGrade"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Risk Grade</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select risk grade" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="A">A - Low Risk</SelectItem>
                                  <SelectItem value="A-">A- - Low Risk</SelectItem>
                                  <SelectItem value="B+">B+ - Medium Risk</SelectItem>
                                  <SelectItem value="B">B - Medium Risk</SelectItem>
                                  <SelectItem value="B-">B- - Medium Risk</SelectItem>
                                  <SelectItem value="C+">C+ - High Risk</SelectItem>
                                  <SelectItem value="C">C - High Risk</SelectItem>
                                  <SelectItem value="C-">C- - High Risk</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={securitizeForm.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 90 days, 6 months" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={securitizeForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Investment Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Detailed description for potential investors" 
                                {...field} 
                                value={field.value || ""} 
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-primary-500 hover:bg-primary-600"
                        disabled={securitizeMutation.isPending}
                      >
                        {securitizeMutation.isPending ? "Securitizing..." : "Securitize Receivable"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <CardContent>
                {receivablesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : receivables.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No receivables yet</p>
                    <p className="text-sm text-gray-500">Add your first receivable to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receivables.map((receivable) => {
                      const security = getSecurityForReceivable(receivable.id);
                      const canSecuritize = receivable.status === "draft" || receivable.status === "active";
                      const isSecuritized = receivable.status === "securitized";
                      const isListed = receivable.status === "listed";
                      
                      return (
                        <div key={receivable.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Receipt className="w-5 h-5 text-primary-500" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{receivable.debtorName}</p>
                                <p className="text-sm text-gray-600">{receivable.currency} {parseFloat(receivable.amount).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={
                                  receivable.status === "active" || receivable.status === "draft" ? "default" : 
                                  receivable.status === "overdue" ? "destructive" : 
                                  receivable.status === "securitized" ? "secondary" :
                                  receivable.status === "listed" ? "outline" : "secondary"
                                }
                              >
                                {receivable.status}
                              </Badge>
                              <p className="text-sm text-gray-600">Due: {format(new Date(receivable.dueDate), "MMM dd, yyyy")}</p>
                              
                              {/* Action buttons based on status */}
                              {canSecuritize && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSecuritize(receivable)}
                                  className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                                >
                                  <Lock className="w-4 h-4 mr-1" />
                                  Securitize
                                </Button>
                              )}
                              
                              {isSecuritized && security && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleListSecurity(security.id)}
                                  disabled={listSecurityMutation.isPending}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <TrendingUp className="w-4 h-4 mr-1" />
                                  List for Sale
                                </Button>
                              )}
                              
                              {isListed && (
                                <div className="flex items-center text-sm text-green-600">
                                  <TrendingUp className="w-4 h-4 mr-1" />
                                  On Marketplace
                                </div>
                              )}
                              
                              {(canSecuritize) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteReceivable(receivable.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {receivable.description && (
                            <p className="mt-2 text-sm text-gray-600 ml-13">{receivable.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button 
                    variant="ghost"
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-colors text-left justify-start"
                  >
                    <Plus className="w-4 h-4 mr-3" />
                    Add Receivable
                  </Button>
                  <Button 
                    variant="ghost"
                    className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-colors text-left justify-start"
                  >
                    <BarChart className="w-4 h-4 mr-3" />
                    View Analytics
                  </Button>
                  <Button 
                    variant="ghost"
                    className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-colors text-left justify-start"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
