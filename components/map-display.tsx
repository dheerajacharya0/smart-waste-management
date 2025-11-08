"use client"

interface MapDisplayProps {
  latitude: number
  longitude: number
}

export function MapDisplay({ latitude, longitude }: MapDisplayProps) {
  // Calculate zoom level
  const zoom = 17

  // Create map URL using OpenStreetMap tiles
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005},${latitude - 0.005},${longitude + 0.005},${latitude + 0.005}&layer=mapnik&marker=${latitude},${longitude}`

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-900">Location on Map</label>
      <div className="border-2 border-emerald-200 rounded-lg overflow-hidden h-64 bg-gray-100">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed`}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="text-xs text-gray-500">
        📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </p>
    </div>
  )
}
