import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { getRecoveryStatus } from "@/lib/queryClient";

interface RecoverySuccessProps {
  recoveryCode?: string;
}

export default function RecoverySuccess({ recoveryCode = "" }: RecoverySuccessProps) {
  const [walletCount, setWalletCount] = useState(0);
  const [totalWallets, setTotalWallets] = useState(250);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    // In a real app, we would poll for actual status from the server
    // using the recovery code
    let intervalId: number;

    const fetchStatusUpdates = async () => {
      try {
        if (recoveryCode) {
          // In a real app, we would use the actual API call
          // const data = await getRecoveryStatus(recoveryCode);
          // setWalletCount(data.data.walletsScanned);
          // setTotalWallets(data.data.totalWallets);
          // if (data.data.status !== "scanning") {
          //   setIsScanning(false);
          //   clearInterval(intervalId);
          // }
        }
      } catch (err) {
        setError("Unable to fetch status updates. The process is continuing in the background.");
        console.error("Error fetching status:", err);
      }
    };

    // For demo purposes, we'll simulate the progress
    intervalId = window.setInterval(() => {
      setWalletCount(prevCount => {
        const newCount = prevCount + Math.floor(Math.random() * 5) + 1;
        if (newCount >= totalWallets) {
          clearInterval(intervalId);
          setIsScanning(false);
          return totalWallets;
        }
        return newCount;
      });
    }, 200);
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [recoveryCode, totalWallets]);
  
  const progressPercentage = Math.min(Math.floor((walletCount / totalWallets) * 100), 100);
  
  return (
    <div className="bg-green-900 bg-opacity-20 border border-green-700 rounded-lg p-6">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
        <h2 className="text-xl font-semibold text-green-300 mb-2">Recovery Process Started</h2>
      </div>
      
      <div className="my-6 px-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-green-100">Scanning wallets...</span>
          <span className="text-green-100 font-mono">{walletCount} / {totalWallets}</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        
        <div className="mt-4 flex items-center justify-center">
          {isScanning ? (
            <div className="flex items-center text-primary">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Scanning in progress...</span>
            </div>
          ) : (
            <div className="text-green-300 font-medium">
              Scan complete!
            </div>
          )}
        </div>
      </div>
      
      <div className="text-center mt-4">
        <p className="text-green-100 mb-4">
          Your funds recovery is processing. This may take a few minutes to complete.
        </p>
        <p className="text-green-100 mb-4">
          Funds will be sent to your specified Bitcoin address once the process is complete.
        </p>
        <p className="text-white">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  );
}
