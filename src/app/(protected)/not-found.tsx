import { AlertCircle } from "lucide-react"

export default function NotFound() {

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            Sorry, the page you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to access it.
          </p>
        </div>
      </div>
    </div>
  )
}
