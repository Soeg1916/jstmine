import RecoveryInstructions from "@/components/RecoveryInstructions";
import RecoveryForm from "@/components/RecoveryForm";
import RecoverySuccess from "@/components/RecoverySuccess";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function RecoveryTool() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{
    recoveryCode: string;
    pdfFilename: string;
    bitcoinAddress: string;
  } | null>(null);
  
  const { toast } = useToast();
  
  const handleRecoveryComplete = (data: {
    recoveryCode: string;
    pdfFilename: string;
    bitcoinAddress: string;
  }) => {
    setRecoveryData(data);
    setShowSuccess(true);
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-primary text-2xl font-mono font-semibold">Muun Recovery Tool v2.2.4</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <RecoveryInstructions />
        
        {!showSuccess ? (
          <RecoveryForm onRecoveryComplete={handleRecoveryComplete} />
        ) : (
          <RecoverySuccess recoveryCode={recoveryData?.recoveryCode} />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 mt-8 border-t border-gray-800 text-muted text-sm">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} Muun. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <a href="#" className="text-muted hover:text-primary mr-4">Privacy Policy</a>
            <a href="#" className="text-muted hover:text-primary mr-4">Terms of Service</a>
            <a href="#" className="text-muted hover:text-primary">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
