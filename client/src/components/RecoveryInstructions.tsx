export default function RecoveryInstructions() {
  return (
    <div className="mb-8">
      <p className="text-white text-lg mb-6">To recover your funds, you will need:</p>
      
      <ol className="space-y-3 mb-8">
        <li className="flex items-start">
          <span className="text-white mr-2">1.</span>
          <span className="text-accent font-medium">Your Recovery Code</span>
          <span className="text-white ml-2">which you wrote down during your security setup</span>
        </li>
        <li className="flex items-start">
          <span className="text-white mr-2">2.</span>
          <span className="text-accent font-medium">Your Emergency Kit PDF</span>
          <span className="text-white ml-2">which you exported from the app</span>
        </li>
        <li className="flex items-start">
          <span className="text-white mr-2">3.</span>
          <span className="text-accent font-medium">Your destination bitcoin address</span>
          <span className="text-white ml-2">where all your funds will be sent</span>
        </li>
      </ol>

      <p className="text-white mb-6">
        If you have any questions, we'll be happy to answer them. Contact us at
        <a href="mailto:support@muun.com" className="text-primary hover:underline ml-1">support@muun.com</a>
      </p>
    </div>
  );
}
