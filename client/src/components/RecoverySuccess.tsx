import { CheckCircle } from "lucide-react";

export default function RecoverySuccess() {
  return (
    <div className="bg-green-900 bg-opacity-20 border border-green-700 rounded-lg p-6 text-center">
      <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
      <h2 className="text-xl font-semibold text-green-300 mb-2">Recovery Process Started</h2>
      <p className="text-green-100 mb-4">
        Your funds recovery is now processing. This may take a few minutes to complete.
      </p>
      <p className="text-green-100 mb-4">
        Funds will be sent to your specified Bitcoin address once the process is complete.
      </p>
      <p className="text-white">
        A confirmation email has been sent to your registered email address.
      </p>
    </div>
  );
}
