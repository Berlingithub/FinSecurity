import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Camera, User, Package, X, Shield } from "lucide-react";
import { createReceivableSchema } from "@shared/schema";

interface EnhancedReceivableFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function EnhancedReceivableForm({ onSubmit, isLoading, onCancel }: EnhancedReceivableFormProps) {
  const [orderPhotos, setOrderPhotos] = useState<string[]>([]);
  const [legalDocuments, setLegalDocuments] = useState<string[]>([]);
  const [debtorContact, setDebtorContact] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [orderDetails, setOrderDetails] = useState({
    orderNumber: "",
    productDescription: "",
    quantity: 1,
    unitPrice: 0,
    totalAmount: 0,
    deliveryDate: "",
  });

  const form = useForm({
    resolver: zodResolver(createReceivableSchema),
    defaultValues: {
      debtorName: "",
      amount: "",
      currency: "USD",
      dueDate: "",
      description: "",
      category: "Services",
      riskLevel: "Medium",
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // In a real app, you would upload to a cloud service
      const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
      setOrderPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // In a real app, you would upload to a cloud service
      const newDocs = Array.from(files).map(file => URL.createObjectURL(file));
      setLegalDocuments(prev => [...prev, ...newDocs]);
    }
  };

  const removePhoto = (index: number) => {
    setOrderPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setLegalDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (data: any) => {
    const enhancedData = {
      ...data,
      dueDiligence: {
        orderPhotos: orderPhotos.length > 0 ? orderPhotos : undefined,
        legalDocuments: legalDocuments.length > 0 ? legalDocuments : undefined,
        debtorContact: debtorContact.name ? debtorContact : undefined,
        orderDetails: orderDetails.orderNumber ? orderDetails : undefined,
      },
    };
    onSubmit(enhancedData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="debtorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Debtor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter debtor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      <SelectItem value="JPY">JPY</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Services">Services</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Construction">Construction</SelectItem>
                      <SelectItem value="Agriculture">Agriculture</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="riskLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the receivable..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Due Diligence Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Due Diligence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Photos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <h4 className="font-medium">Order Photos</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {orderPhotos.map((photo, index) => (
                <div key={index} className="relative">
                  <img src={photo} alt={`Order photo ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                <Upload className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
          </div>

          {/* Legal Documents */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <h4 className="font-medium">Legal Documents</h4>
            </div>
            <div className="space-y-2">
              {legalDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Document {index + 1}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeDocument(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                <Upload className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Upload Documents</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  className="hidden"
                  onChange={handleDocumentUpload}
                />
              </label>
            </div>
          </div>

          {/* Debtor Contact Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <h4 className="font-medium">Debtor Contact Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Contact Name"
                value={debtorContact.name}
                onChange={(e) => setDebtorContact(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Email"
                type="email"
                value={debtorContact.email}
                onChange={(e) => setDebtorContact(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input
                placeholder="Phone"
                value={debtorContact.phone}
                onChange={(e) => setDebtorContact(prev => ({ ...prev, phone: e.target.value }))}
              />
              <Input
                placeholder="Address"
                value={debtorContact.address}
                onChange={(e) => setDebtorContact(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <h4 className="font-medium">Order Details</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Order Number"
                value={orderDetails.orderNumber}
                onChange={(e) => setOrderDetails(prev => ({ ...prev, orderNumber: e.target.value }))}
              />
              <Input
                placeholder="Product Description"
                value={orderDetails.productDescription}
                onChange={(e) => setOrderDetails(prev => ({ ...prev, productDescription: e.target.value }))}
              />
              <Input
                placeholder="Quantity"
                type="number"
                value={orderDetails.quantity}
                onChange={(e) => setOrderDetails(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              />
              <Input
                placeholder="Unit Price"
                type="number"
                value={orderDetails.unitPrice}
                onChange={(e) => setOrderDetails(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
              />
              <Input
                placeholder="Delivery Date"
                type="date"
                value={orderDetails.deliveryDate}
                onChange={(e) => setOrderDetails(prev => ({ ...prev, deliveryDate: e.target.value }))}
              />
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
        <Button onClick={form.handleSubmit(handleSubmit)} disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Receivable"}
        </Button>
      </div>
    </div>
  );
}
