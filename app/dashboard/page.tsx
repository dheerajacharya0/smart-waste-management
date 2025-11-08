"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Trash2, MapPin, Calendar, AlertCircle, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MapDisplay } from "@/components/map-display"

interface Complaint {
  id: string
  image?: string  // For backwards compatibility
  images?: string[]  // Multiple images support
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
  const [selectedImages, setSelectedImages] = useState<{ [key: string]: number }>({})

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
            {complaints.map((complaint) => {
              const complaintImages = complaint.images || (complaint.image ? [complaint.image] : []);
              
              return (
              <Card key={complaint.id} className="overflow-hidden hover:shadow-xl transition-all border-l-4 border-l-emerald-500">
                <div className="p-6 space-y-6">
                  {/* Header with ID and Date */}
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Report #{complaint.id.slice(-6)}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(complaint.timestamp)}
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_COLORS[complaint.status]}`}>
                      {complaint.status}
                    </div>
                  </div>
                  {/* Top Row: Image Gallery and Basic Info */}
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Image Gallery */}
                    <div className="space-y-3">
                      {(() => {
                        const complaintImages = complaint.images || (complaint.image ? [complaint.image] : []);
                        const currentIndex = selectedImages[complaint.id] || 0;
                        
                        return (
                          <>
                            {/* Main Image */}
                            <div className="relative group">
                              <img
                                src={complaintImages[currentIndex] || "/placeholder.svg"}
                                alt={`Report photo ${currentIndex + 1}`}
                                className="w-full h-56 object-cover rounded-lg shadow-md"
                              />
                              
                              {/* Image counter badge */}
                              {complaintImages.length > 1 && (
                                <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm">
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  {currentIndex + 1} / {complaintImages.length}
                                </div>
                              )}
                              
                              {/* Navigation arrows for multiple images */}
                              {complaintImages.length > 1 && (
                                <>
                                  <button
                                    onClick={() => setSelectedImages(prev => ({
                                      ...prev,
                                      [complaint.id]: currentIndex > 0 ? currentIndex - 1 : complaintImages.length - 1
                                    }))}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                    title="Previous image"
                                  >
                                    <ChevronLeft className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => setSelectedImages(prev => ({
                                      ...prev,
                                      [complaint.id]: currentIndex < complaintImages.length - 1 ? currentIndex + 1 : 0
                                    }))}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                    title="Next image"
                                  >
                                    <ChevronRight className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </div>
                            
                            {/* Thumbnail Strip */}
                            {complaintImages.length > 1 && (
                              <div className="flex gap-2 overflow-x-auto pb-1">
                                {complaintImages.map((img, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedImages(prev => ({ ...prev, [complaint.id]: idx }))}
                                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden transition-all ${
                                      currentIndex === idx 
                                        ? 'ring-2 ring-emerald-500 ring-offset-2 scale-105' 
                                        : 'opacity-60 hover:opacity-100'
                                    }`}
                                  >
                                    <img
                                      src={img}
                                      alt={`Thumbnail ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                        <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          Location
                        </p>
                        <p className="text-sm text-gray-900 font-mono">
                          {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                        </p>
                      </div>

                      {complaintImages.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5" />
                            Photos
                          </p>
                          <p className="text-sm text-gray-900">
                            {complaintImages.length} photo{complaintImages.length !== 1 ? 's' : ''} attached
                          </p>
                        </div>
                      )}

                      {complaint.description && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-700 font-semibold uppercase tracking-wide mb-2">Description</p>
                          <p className="text-sm text-gray-900 leading-relaxed">{complaint.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-700 font-semibold uppercase tracking-wide mb-3">Update Status</p>
                        <div className="space-y-2">
                          {(["Submitted", "In Progress", "Resolved"] as const).map((status) => {
                            const isActive = complaint.status === status;
                            const icons = {
                              "Submitted": "📋",
                              "In Progress": "🔧",
                              "Resolved": "✅"
                            };
                            
                            return (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(complaint.id, status)}
                                className={`w-full py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                                  isActive
                                    ? `${STATUS_COLORS[status]} shadow-sm`
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                <span className="mr-2">{icons[status]}</span>
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(complaint.id)}
                        className="w-full py-2.5 px-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Report
                      </button>
                    </div>
                  </div>

                  {/* Map Display */}
                  <div className="border-t pt-6">
                    <div className="mb-3">
                      <p className="text-xs text-gray-700 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        Map Location
                      </p>
                    </div>
                    <MapDisplay latitude={complaint.latitude} longitude={complaint.longitude} />
                  </div>
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  )
}
