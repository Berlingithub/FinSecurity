import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md mx-auto">
          <Card className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="text-white h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SecureReceivables</h2>
                <p className="text-gray-600">Your trusted platform for receivables securitization and investment opportunities</p>
              </div>
              
              <div className="space-y-4">
                <Button 
                  onClick={handleLogin}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Sign In
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleLogin}
                  className="w-full hover:bg-gray-50 text-primary-500 font-medium py-3 px-4 rounded-lg border-2 border-primary-500 transition-colors"
                >
                  Create Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
