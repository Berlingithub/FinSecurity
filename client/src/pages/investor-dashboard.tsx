import { useEffect } from "react";
import { LogOut, Wallet, TrendingUp, Coins, Shield, Search, Calculator, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";

export default function InvestorDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

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
                  <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                  <p className="text-2xl font-bold text-gray-900">$875,000</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-success-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-success-500 font-medium">+15.2%</span>
                <span className="text-gray-600 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Investments</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">Across 8 pools</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Returns</p>
                  <p className="text-2xl font-bold text-gray-900">$12,450</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Coins className="w-5 h-5 text-accent-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-success-500 font-medium">+8.5%</span>
                <span className="text-gray-600 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Risk Score</p>
                  <p className="text-2xl font-bold text-gray-900">B+</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">Moderate risk level</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investment Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">New Investment Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">Tech Receivables Pool #47</h4>
                      <p className="text-sm text-gray-600">By TechCorp Inc.</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      Grade A
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Pool Size</p>
                      <p className="font-semibold">$250,000</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Expected Return</p>
                      <p className="font-semibold text-success-600">8.5%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-semibold">90 days</p>
                    </div>
                  </div>
                  <Button className="mt-3 w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                    View Details
                  </Button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">Manufacturing Receivables Pool #48</h4>
                      <p className="text-sm text-gray-600">By Industrial Solutions Ltd.</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                      Grade B+
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Pool Size</p>
                      <p className="font-semibold">$180,000</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Expected Return</p>
                      <p className="font-semibold text-success-600">7.2%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-semibold">120 days</p>
                    </div>
                  </div>
                  <Button className="mt-3 w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-success-500 to-success-600 text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Investment Tools</h3>
                <div className="space-y-3">
                  <Button 
                    variant="ghost"
                    className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-colors text-left justify-start"
                  >
                    <Search className="w-4 h-4 mr-3" />
                    Browse Pools
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
      </main>
    </div>
  );
}
