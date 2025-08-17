import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Banknote, Bitcoin, Smartphone, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { type Security } from "@shared/schema";
import { z } from "zod";

const purchaseSecuritySchema = z.object({
  paymentMethod: z.enum(["credit_card", "bank_transfer", "crypto", "digital_wallet"]),
  amount: z.string(),
});

type PurchaseSecurity = z.infer<typeof purchaseSecuritySchema>;

interface PaymentFormProps {
  security: Security;
  onSubmit: (data: PurchaseSecurity) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function PaymentForm({ security, onSubmit, isLoading, onCancel }: PaymentFormProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("credit_card");
  
  const form = useForm<PurchaseSecurity>({
    resolver: zodResolver(purchaseSecuritySchema),
    defaultValues: {
      paymentMethod: "credit_card",
      amount: security.totalValue,
    },
  });

  const securityAmount = parseFloat(security.totalValue);
  const commissionAmount = securityAmount * 0.01; // 1% commission
  const totalAmount = securityAmount + commissionAmount;

  const paymentMethods = [
    {
      id: "credit_card",
      name: "Credit Card",
      icon: CreditCard,
      description: "Visa, Mastercard, American Express",
      processingTime: "Instant",
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      icon: Banknote,
      description: "Direct bank transfer",
      processingTime: "1-3 business days",
    },
    {
      id: "crypto",
      name: "Cryptocurrency",
      icon: Bitcoin,
      description: "Bitcoin, Ethereum, USDC",
      processingTime: "5-30 minutes",
    },
    {
      id: "digital_wallet",
      name: "Digital Wallet",
      icon: Smartphone,
      description: "PayPal, Apple Pay, Google Pay",
      processingTime: "Instant",
    },
  ];

  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethod(method);
    form.setValue("paymentMethod", method as any);
  };

  const handleSubmit = (data: PurchaseSecurity) => {
    onSubmit({
      ...data,
      amount: security.totalValue,
    });
  };

  return (
    <div className="space-y-6">
      {/* Security Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Security Title</span>
            <span className="font-medium">{security.title}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Security Value</span>
            <span className="font-medium">${securityAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Expected Return</span>
            <span className="font-medium text-green-600">
              {security.expectedReturn ? `${security.expectedReturn}%` : "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Risk Grade</span>
            <Badge variant={security.riskGrade === "A" || security.riskGrade === "A-" ? "default" : "secondary"}>
              {security.riskGrade}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Duration</span>
            <span className="font-medium">{security.duration}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedPaymentMethod === method.id;
              
              return (
                <div
                  key={method.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handlePaymentMethodChange(method.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? "bg-blue-500 text-white" : "bg-gray-100"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{method.name}</h4>
                      <p className="text-sm text-gray-600">{method.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Processing: {method.processingTime}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {selectedPaymentMethod === "credit_card" && (
                <>
                  <FormField
                    control={form.control}
                    name="cardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Number</FormLabel>
                        <FormControl>
                          <Input placeholder="1234 5678 9012 3456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input placeholder="MM/YY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cvv"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CVV</FormLabel>
                          <FormControl>
                            <Input placeholder="123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {selectedPaymentMethod === "bank_transfer" && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Bank Transfer Details</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Please transfer the amount to the following account:
                    </p>
                    <div className="space-y-1 text-sm">
                      <p><strong>Account Name:</strong> TradeSec Platform</p>
                      <p><strong>Account Number:</strong> 1234567890</p>
                      <p><strong>Routing Number:</strong> 987654321</p>
                      <p><strong>Reference:</strong> SEC-{security.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === "crypto" && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Cryptocurrency Payment</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Send the equivalent amount in your preferred cryptocurrency:
                    </p>
                    <div className="space-y-1 text-sm">
                      <p><strong>Bitcoin Address:</strong> bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</p>
                      <p><strong>Ethereum Address:</strong> 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6</p>
                      <p><strong>USDC Address:</strong> 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === "digital_wallet" && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Digital Wallet Payment</h4>
                    <p className="text-sm text-gray-600">
                      You will be redirected to your selected digital wallet to complete the payment.
                    </p>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Security Value</span>
            <span className="font-medium">${securityAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Platform Commission (1%)</span>
            <span className="font-medium text-orange-600">${commissionAmount.toFixed(2)}</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount</span>
              <span className="font-bold text-lg">${totalAmount.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Important Information</p>
                <ul className="mt-1 space-y-1">
                  <li>• 1% commission is charged on all transactions</li>
                  <li>• Payment processing is secure and encrypted</li>
                  <li>• You will receive confirmation once payment is processed</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={form.handleSubmit(handleSubmit)} 
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? "Processing..." : `Pay $${totalAmount.toLocaleString()}`}
        </Button>
      </div>
    </div>
  );
}
