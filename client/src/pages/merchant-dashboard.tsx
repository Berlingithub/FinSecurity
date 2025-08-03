import { useEffect } from "react";
import { LogOut, FileText, Shield, Layers, Star, Receipt, Plus, BarChart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

export default function MerchantDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

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
                  <p className="text-2xl font-bold text-gray-900">$245,000</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-success-500 font-medium">+12%</span>
                <span className="text-gray-600 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Securitized Amount</p>
                  <p className="text-2xl font-bold text-gray-900">$150,000</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-success-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-success-500 font-medium">+8%</span>
                <span className="text-gray-600 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Pools</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-accent-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">2 pending approval</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">4.8</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">Based on 24 reviews</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Receivables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Receipt className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">TechCorp Inc.</p>
                      <p className="text-sm text-gray-600">Invoice #12345</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">$25,000</p>
                    <p className="text-sm text-gray-600">Due: Jan 15, 2024</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Receipt className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Global Solutions LLC</p>
                      <p className="text-sm text-gray-600">Invoice #12346</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">$35,000</p>
                    <p className="text-sm text-gray-600">Due: Jan 20, 2024</p>
                  </div>
                </div>
                
                <Button className="mt-4 w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors">
                  Add New Receivable
                </Button>
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
                    className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-colors text-left justify-start"
                  >
                    <Plus className="w-4 h-4 mr-3" />
                    Create Pool
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
