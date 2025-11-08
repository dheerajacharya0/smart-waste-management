"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Trash2, MapPin, Calendar, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MapDisplay } from "@/components/map-display"

interface Complaint {
  id: string
  image: string
  latitude: number
  longitude: number
  description: string
  timestamp: string
  status: "Submitted" | "In Progress" | "Resolved"
}

const STATUS_COLORS = {
  Submitted: "bg-blue-100 text-blue-800",
  "In Progress": "bg-yellow-100 text-yellow-800",
  Resolved: "bg-green-100 text-green-800",
}

export default function DashboardPage() {
  const { toast } = useToast()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  // Load complaints from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("complaints") || "[]")
    setComplaints(stored)
    setLoading(false)
  }, [])

  const handleStatusChange = (id: string, newStatus: Complaint["status"]) => {
    const updated = complaints.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    setComplaints(updated)
    localStorage.setItem("complaints", JSON.stringify(updated))

    const statusEmoji = {
      Submitted: "📋",
      "In Progress": "🔧",
      Resolved: "✅",
    }

    toast({
      title: "Status Updated",
      description: `${statusEmoji[newStatus]} Complaint status changed to ${newStatus}`,
    })
  }

  const handleDelete = (id: string) => {
    const updated = complaints.filter((c) => c.id !== id)
    setComplaints(updated)
    localStorage.setItem("complaints", JSON.stringify(updated))

    toast({
      title: "Deleted",
      description: "Complaint has been removed from your dashboard.",
    })
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const stats = {
    total: complaints.length,
    submitted: complaints.filter((c) => c.status === "Submitted").length,
    inProgress: complaints.filter((c) => c.status === "In Progress").length,
    resolved: complaints.filter((c) => c.status === "Resolved").length,
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="bg-emerald-700 text-white py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-emerald-100 hover:text-white w-fit mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span>Back Home</span>
          </Link>
          <h1 className="text-2xl font-bold">My Reports Dashboard</h1>
        </div>
      </header>

      {/* Stats Section */}
      <section className="bg-emerald-700 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-emerald-600 rounded-lg p-4">
              <p className="text-emerald-100 text-sm font-medium">Total Reports</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-600 rounded-lg p-4">
              <p className="text-blue-100 text-sm font-medium">Submitted</p>
              <p className="text-3xl font-bold mt-2">{stats.submitted}</p>
            </div>
            <div className="bg-yellow-600 rounded-lg p-4">
              <p className="text-yellow-100 text-sm font-medium">In Progress</p>
              <p className="text-3xl font-bold mt-2">{stats.inProgress}</p>
            </div>
            <div className="bg-green-600 rounded-lg p-4">
              <p className="text-green-100 text-sm font-medium">Resolved</p>
              <p className="text-3xl font-bold mt-2">{stats.resolved}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading your reports...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Reports Yet</h2>
            <p className="text-gray-600 mb-6">Start by reporting a littered area to track cleanup progress.</p>
            <Link href="/report">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Create First Report</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {complaints.map((complaint) => (
              <Card key={complaint.id} className="overflow-hidden hover:shadow-lg transition">
                <div className="p-6 space-y-6">
                  {/* Top Row: Image and Basic Info */}
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Image */}
                    <div>
                      <img
                        src={complaint.image || "/placeholder.svg"}
                        alt="Complaint"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(complaint.timestamp)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4" />
                          Coordinates
                        </p>
                        <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                          {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                        </p>
                      </div>

                      {complaint.description && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Description</p>
                          <p className="text-sm text-gray-900">{complaint.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Status</p>
                        <div className="space-y-2">
                          {(["Submitted", "In Progress", "Resolved"] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(complaint.id, status)}
                              className={`w-full py-2 px-3 rounded text-sm font-medium transition ${
                                complaint.status === status
                                  ? STATUS_COLORS[status]
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(complaint.id)}
                        className="w-full py-2 px-3 bg-red-50 text-red-600 rounded text-sm font-medium hover:bg-red-100 transition flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Map Display */}
                  <div className="border-t pt-6">
                    <MapDisplay latitude={complaint.latitude} longitude={complaint.longitude} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
