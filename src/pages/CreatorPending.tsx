export default function CreatorPending() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Application Under Review
        </h2>

        <p className="text-gray-600 mb-6">
          Your creator application is currently under review.
          You will be notified once a decision has been made.
        </p>

        <div className="text-sm text-gray-400">
          This process ensures quality and trust across the platform.
        </div>
      </div>
    </div>
  );
}
