import { useState, useEffect } from "react";
import { User, Settings, Save, ArrowLeft, Phone, MapPin, CreditCard, Mail, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { updateProfileSchema, type UpdateProfile } from "@shared/schema";
import { useLocation } from "wouter";
import Header from "@/components/Header";

export default function Profile() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      address: "",
    },
  });

  // Load profile data and check for local storage data
  useEffect(() => {
    if (user) {
      const localStorageKey = `profile_${user.id}`;
      const localData = localStorage.getItem(localStorageKey);
      
      if (localData) {
        try {
          const parsedData = JSON.parse(localData);
          form.reset({
            firstName: parsedData.firstName || user.firstName || "",
            lastName: parsedData.lastName || user.lastName || "",
            phoneNumber: parsedData.phoneNumber || user.phoneNumber || "",
            address: parsedData.address || user.address || "",
          });
          setHasLocalChanges(true);
        } catch (error) {
          console.error("Error parsing local storage data:", error);
          // Fall back to user data
          form.reset({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phoneNumber: user.phoneNumber || "",
            address: user.address || "",
          });
        }
      } else {
        form.reset({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phoneNumber: user.phoneNumber || "",
          address: user.address || "",
        });
      }
    }
  }, [user, form]);

  // Save to local storage on form change
  const watchedValues = form.watch();
  useEffect(() => {
    if (user && Object.keys(watchedValues).some(key => watchedValues[key as keyof UpdateProfile])) {
      const localStorageKey = `profile_${user.id}`;
      localStorage.setItem(localStorageKey, JSON.stringify(watchedValues));
      
      // Check if there are changes from the original user data
      const hasChanges = 
        watchedValues.firstName !== (user.firstName || "") ||
        watchedValues.lastName !== (user.lastName || "") ||
        watchedValues.phoneNumber !== (user.phoneNumber || "") ||
        watchedValues.address !== (user.address || "");
      
      setHasLocalChanges(hasChanges);
    }
  }, [watchedValues, user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully!",
      });
      
      // Clear local storage after successful save
      if (user) {
        localStorage.removeItem(`profile_${user.id}`);
        setHasLocalChanges(false);
      }
      
      // Update the user data in the cache
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateProfile) => {
    updateProfileMutation.mutate(data);
  };

  const handleGoBack = () => {
    if (user?.role === "merchant") {
      setLocation("/");
    } else if (user?.role === "investor") {
      setLocation("/");
    } else {
      setLocation("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to access your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
              <p className="text-gray-600">Manage your account information</p>
            </div>
          </div>
          {hasLocalChanges && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Unsaved Changes
            </Badge>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCircle className="w-5 h-5" />
                  <span>Account Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {user.firstName || user.lastName ? 
                      `${user.firstName || ""} ${user.lastName || ""}`.trim() : 
                      "User"
                    }
                  </h3>
                  <Badge 
                    variant={user.role === "merchant" ? "default" : "secondary"}
                    className="mt-2"
                  >
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                  </Badge>
                </div>
                
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{user.email}</span>
                  </div>
                  
                  {user.phoneNumber && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{user.phoneNumber}</span>
                    </div>
                  )}
                  
                  {user.address && (
                    <div className="flex items-start space-x-3 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-600">{user.address}</span>
                    </div>
                  )}
                  
                  {user.role === "investor" && (
                    <div className="flex items-center space-x-3 text-sm">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        Wallet: ${user.walletBalance ? parseFloat(user.walletBalance).toLocaleString() : "0.00"}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bank Details Placeholder */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 mb-2">Bank Account Details</h4>
                  <p className="text-sm text-gray-500">
                    For payments/receipts - not implemented
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    This section would contain secure banking information in a production environment
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your first name" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your last name" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your phone number" 
                              type="tel"
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter your full address"
                              rows={3}
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-4 pt-6 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          form.reset({
                            firstName: user.firstName || "",
                            lastName: user.lastName || "",
                            phoneNumber: user.phoneNumber || "",
                            address: user.address || "",
                          });
                          if (user) {
                            localStorage.removeItem(`profile_${user.id}`);
                            setHasLocalChanges(false);
                          }
                        }}
                      >
                        Reset Changes
                      </Button>
                      
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending || !hasLocalChanges}
                        className="flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </span>
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}