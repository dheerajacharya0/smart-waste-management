"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Loader2, MapPin, Camera, Upload } from "lucide-react"
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

export default function ReportPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [image, setImage] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationLoading(false)
        },
        () => {
          toast({
            title: "Location Error",
            description: "Could not access your location. Please enable location services.",
            variant: "destructive",
          })
          setLocationLoading(false)
        },
      )
    }
  }, [toast])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please enable location services before uploading a photo.",
        variant: "destructive",
      })
      return
    }

    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        stopCamera();
      }

      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        // Wait for the video element to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(resolve).catch(console.error);
            };
          }
        });

        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
        setCameraError(null);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      const errorMessage = err instanceof Error ? err.message : 'Could not access camera';
      setCameraError(errorMessage);
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setImage(imageDataUrl);
        stopCamera();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!image) {
      toast({
        title: "Missing Photo",
        description: "Please upload a photo of the littered area.",
        variant: "destructive",
      })
      return
    }

    if (!location) {
      toast({
        title: "Missing Location",
        description: "Location is required to submit a complaint.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const complaint: Complaint = {
        id: Date.now().toString(),
        image,
        latitude: location.lat,
        longitude: location.lng,
        description,
        timestamp: new Date().toISOString(),
        status: "Submitted",
      }

      const existing = JSON.parse(localStorage.getItem("complaints") || "[]")
      localStorage.setItem("complaints", JSON.stringify([...existing, complaint]))

      toast({
        title: "Success!",
        description: "Your complaint has been submitted successfully.",
      })

      setIsSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <header className="bg-emerald-700 text-white py-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 text-emerald-100 hover:text-white w-fit">
              <ArrowLeft className="w-5 h-5" />
              <span>Back Home</span>
            </Link>
          </div>
        </header>
        <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">Thank you for helping keep our community clean. Your report has been received.</p>
            <div className="space-x-4">
              <Button asChild variant="outline">
                <Link href="/">Back to Home</Link>
              </Button>
              <Button asChild>
                <Link href="/report">Submit Another Report</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="bg-emerald-700 text-white py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-emerald-100 hover:text-white w-fit">
            <ArrowLeft className="w-5 h-5" />
            <span>Back Home</span>
          </Link>
        </div>
      </header>

      {/* Form Section */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Waste</h1>
        <p className="text-gray-600 mb-8">Help us keep our community clean by reporting littered areas.</p>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location - Moved First */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                <MapPin className="w-4 h-4 inline mr-2" />
                Location *
              </label>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                {locationLoading ? (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Getting your location...</span>
                  </div>
                ) : location ? (
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-900">📍 Location Captured</p>
                      <p className="text-sm text-gray-600">Latitude: {location.lat.toFixed(6)}</p>
                      <p className="text-sm text-gray-600">Longitude: {location.lng.toFixed(6)}</p>
                    </div>
                    <MapDisplay latitude={location.lat} longitude={location.lng} />
                  </div>
                ) : (
                  <p className="text-red-600 text-sm">Unable to access location</p>
                )}
              </div>
            </div>

            {/* Photo Upload - Disabled until location is obtained */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                <Camera className="w-4 h-4 inline mr-2" />
                Photo of Littered Area *{" "}
                {!location && <span className="text-xs text-red-600">(Location required first)</span>}
              </label>
              
              {showCamera ? (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-auto max-h-[60vh] object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={captureImage}
                        className="bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors"
                        title="Take photo"
                      >
                        <Camera className="w-6 h-6 text-gray-800" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                      title="Close camera"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  {cameraError && <p className="text-red-500 text-sm">{cameraError}</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center transition border-emerald-300">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={!location || locationLoading}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className={`cursor-pointer block p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
                            !location ? "opacity-50 pointer-events-none" : ""
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Upload className="w-6 h-6 text-gray-500" />
                            <span className="text-sm font-medium">Upload from device</span>
                            <span className="text-xs text-gray-500">JPG, PNG up to 5MB</span>
                          </div>
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={startCamera}
                        disabled={!location || locationLoading}
                        className={`flex-1 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center justify-center space-y-2 ${
                          !location ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Camera className="w-6 h-6 text-gray-500" />
                        <span className="text-sm font-medium">Take a photo</span>
                        <span className="text-xs text-gray-500">Use your camera</span>
                      </button>
                    </div>
                  </div>
                  {image ? (
                    <div className="mt-4 space-y-2">
                      <img
                        src={image}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded"
                      />
                      <div className="flex justify-center space-x-4 mt-2">
                        <button
                          type="button"
                          onClick={() => setImage(null)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove photo
                        </button>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                        >
                          Retake photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-4">
                      <Camera className={`w-8 h-8 mx-auto ${location ? "text-emerald-600" : "text-gray-400"}`} />
                      <p className={`text-center font-medium ${location ? "text-gray-900" : "text-gray-500"}`}>
                        {location ? "Click to upload or drag and drop" : "Enable location to upload photo"}
                      </p>
                      <p className="text-sm text-gray-500 text-center">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Description */}
            <div className="space-y-3">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-900">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the waste type, area conditions, or any additional details..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading || !location || !image}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
              <Link href="/" className="flex-1">
                <Button type="button" variant="outline" className="w-full bg-transparent">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </section>
    </main>
  )
}
