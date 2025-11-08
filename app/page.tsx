import Link from "next/link"
import { MapPin, AlertCircle, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="bg-emerald-700 text-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8" />
            <h1 className="text-3xl font-bold">SmartWaste Report</h1>
          </div>
          <p className="text-emerald-100">
            Help keep our communities clean. Report littered areas and track cleanup progress.
          </p>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight text-balance">
              Make a Difference in Your Community
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              See littered areas around you? Report them instantly with photos and location data. Help authorities
              prioritize cleanup efforts and track progress in real-time.
            </p>
            <div className="space-y-4">
              <div className="flex gap-3">
                <MapPin className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Automatic Location Tracking</h3>
                  <p className="text-gray-600">Your location is automatically captured for accurate reporting</p>
                </div>
              </div>
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Photo Verification</h3>
                  <p className="text-gray-600">Upload evidence photos to support your waste complaints</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Leaf className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Track Resolution</h3>
                  <p className="text-gray-600">Monitor the status of your reports from submission to resolution</p>
                </div>
              </div>
            </div>
            <Link href="/report">
              <Button size="lg" className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                Report Waste Now
              </Button>
            </Link>
          </div>
          <div className="bg-emerald-100 rounded-lg p-8 flex items-center justify-center min-h-96">
            <div className="text-center">
              <AlertCircle className="w-32 h-32 text-emerald-600 mx-auto mb-4 opacity-30" />
              <p className="text-gray-600">Report littered areas and help keep communities clean</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-emerald-700 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">0</div>
              <p className="text-emerald-100">Reports Submitted</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">0</div>
              <p className="text-emerald-100">Areas In Progress</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">0</div>
              <p className="text-emerald-100">Resolved Issues</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Help?</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Start reporting waste today. Your contribution helps create cleaner, healthier communities.
        </p>
        <Link href="/report">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
            Report Your First Issue
          </Button>
        </Link>
      </section>
    </main>
  )
}
