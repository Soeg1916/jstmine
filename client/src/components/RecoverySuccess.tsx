import { CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { getRecoveryStatus } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RecoverySuccessProps {
  recoveryCode?: string;
}

export default function RecoverySuccess({ recoveryCode = "" }: RecoverySuccessProps) {
  const [walletCount, setWalletCount] = useState(0);
  const [totalWallets, setTotalWallets] = useState(250);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState("");
  const [satoshisFound, setSatoshisFound] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [scanComplete, setScanComplete] = useState(false);
  
  useEffect(() => {
    // In a real app, we would poll for actual status from the server
    // using the recovery code
    let intervalId: number;

    const fetchStatusUpdates = async () => {
      try {
        if (recoveryCode) {
          // For the demo, we'll use the API endpoint with simulated data
          const data = await getRecoveryStatus(recoveryCode);
          
          if (data && data.success) {
            // Update UI based on API response
            setWalletCount(data.data.walletsScanned);
            setTotalWallets(data.data.totalWallets);
            
            // Update if we found satoshis
            if (data.data.satoshisFound && !satoshisFound) {
              setSatoshisFound(data.data.satoshisFound);
            }
            
            // Update if we have a transaction hash
            if (data.data.txHash && !txHash) {
              setTxHash(data.data.txHash);
            }
            
            // Update scanning status
            if (data.data.status !== "scanning") {
              setIsScanning(false);
              
              if (data.data.status === "transaction_sent") {
                setScanComplete(true);
              }
            }
          }
        }
      } catch (err) {
        setError("Unable to fetch status updates. The process is continuing in the background.");
        console.error("Error fetching status:", err);
      }
    };

    // For demo purposes, we'll start with simulation
    // but in a real app, we would use only the API polling
    
    // Initial fetch immediately
    fetchStatusUpdates();
    
    // Then set up interval for polling
    intervalId = window.setInterval(() => {
      fetchStatusUpdates();
      
      // Fallback simulation in case API doesn't return expected values
      // This would be removed in a production app
      if (walletCount < 100) {
        setWalletCount(prevCount => {
          const newCount = prevCount + Math.floor(Math.random() * 5) + 1;
          return newCount;
        });
      }
    }, 1000); // Check every second
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [recoveryCode, walletCount, totalWallets, satoshisFound, txHash]);
  
  const progressPercentage = Math.min(Math.floor((walletCount / totalWallets) * 100), 100);
  
  const formatSats = (sats: number) => {
    return new Intl.NumberFormat().format(sats);
  };
  
  return (
    <div className="bg-green-900 bg-opacity-20 border border-green-700 rounded-lg p-6">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
        <h2 className="text-xl font-semibold text-green-300 mb-2">
          {scanComplete ? "Recovery Complete" : "Recovery Process Started"}
        </h2>
      </div>
      
      <div className="my-6 px-2">
        {!scanComplete && (
          <>
            <div className="flex justify-between items-center mb-2">
              <span className="text-green-100">Scanning wallets...</span>
              <span className="text-green-100 font-mono">{walletCount} / {totalWallets}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </>
        )}
        
        <div className="mt-4 flex items-center justify-center">
          {isScanning ? (
            <div className="flex items-center text-primary">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Scanning in progress...</span>
            </div>
          ) : (
            <div className="text-green-300 font-medium">
              Scan complete! {satoshisFound && `Found ${formatSats(satoshisFound)} satoshis.`}
            </div>
          )}
        </div>
        
        {satoshisFound && (
          <div className="mt-6 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4">
            <h3 className="text-blue-300 font-medium mb-2">Funds Found!</h3>
            <p className="text-white mb-3">
              We've discovered <span className="font-mono font-bold">{formatSats(satoshisFound)}</span> satoshis 
              ({(satoshisFound / 100000000).toFixed(8)} BTC) in the wallets we scanned.
            </p>
            
            {txHash ? (
              <div className="mt-4">
                <h4 className="text-blue-300 mb-2">Transaction Sent!</h4>
                <div className="bg-gray-900 p-3 rounded-md font-mono text-sm text-white break-all mb-3">
                  {txHash}
                </div>
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center text-blue-400 border-blue-700 hover:text-blue-300 hover:border-blue-500"
                    onClick={() => window.open(`https://mempool.space/tx/${txHash}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Transaction
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center text-yellow-300">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Creating transaction to send funds...</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="text-center mt-4">
        {!satoshisFound && !scanComplete && (
          <p className="text-yellow-100 mb-4">
            <strong>Note:</strong> We could potentially scan up to 20,000 wallet addresses to find your funds.
            The process will stop once your bitcoins are found.
          </p>
        )}
        
        {txHash ? (
          <Alert className="bg-green-900 bg-opacity-30 border border-green-700 mt-6">
            <AlertDescription className="text-green-200">
              Funds are on their way to your specified Bitcoin address. The transaction has been broadcast to the Bitcoin network.
            </AlertDescription>
          </Alert>
        ) : (
          <p className="text-green-100 mb-4">
            {satoshisFound 
              ? "Preparing to send funds to your specified Bitcoin address..." 
              : "Funds will be sent to your specified Bitcoin address once found and the process is complete."}
          </p>
        )}
        
        <p className="text-white">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  );
}
