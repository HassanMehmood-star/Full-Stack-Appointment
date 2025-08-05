"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, User, Mail, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface Appointment {
  id: number
  date: string
  description: string
  status: string
  patient: { id: number; name: string; email: string }
}

export default function NotificationsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seenNotifications, setSeenNotifications] = useState<Set<number>>(new Set())
  const [markingAsSeen, setMarkingAsSeen] = useState<number | null>(null)
  const [markingAllAsSeen, setMarkingAllAsSeen] = useState(false)

  useEffect(() => {
    const fetchUnseenAppointments = async () => {
      const token = localStorage.getItem("token")
      try {
        const res = await fetch("http://localhost:4000/api/appointments/doctor/unseen", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (res.ok) {
          const data = await res.json()
          setAppointments(data)
        } else {
          throw new Error("Failed to fetch unseen appointments")
        }
      } catch (error) {
        setError("Something went wrong while loading notifications")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchUnseenAppointments()
  }, [])

  const markAsSeen = async (appointmentId: number) => {
    const token = localStorage.getItem("token")
    setMarkingAsSeen(appointmentId)

    try {
      const res = await fetch(`http://localhost:4000/api/appointments/${appointmentId}/seen`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (res.ok) {
        setSeenNotifications((prev) => new Set([...prev, appointmentId]))
      } else {
        throw new Error("Failed to mark as seen")
      }
    } catch (error) {
      console.error("Error marking as seen:", error)
    } finally {
      setMarkingAsSeen(null)
    }
  }

  const markAllAsSeen = async () => {
    const token = localStorage.getItem("token")
    setMarkingAllAsSeen(true)

    try {
      const res = await fetch("http://localhost:4000/api/appointments/doctor/mark-all-seen", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (res.ok) {
        const allIds = new Set(appointments.map((apt) => apt.id))
        setSeenNotifications(allIds)
      } else {
        throw new Error("Failed to mark all as seen")
      }
    } catch (error) {
      console.error("Error marking all as seen:", error)
    } finally {
      setMarkingAllAsSeen(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        variant: "secondary" as const,
        icon: Clock,
        bgColor: "bg-gradient-to-r from-yellow-400 to-orange-500",
        textColor: "text-white",
      },
      confirmed: {
        variant: "default" as const,
        icon: CheckCircle,
        bgColor: "bg-gradient-to-r from-green-400 to-emerald-500",
        textColor: "text-white",
      },
      cancelled: {
        variant: "destructive" as const,
        icon: XCircle,
        bgColor: "bg-gradient-to-r from-red-400 to-pink-500",
        textColor: "text-white",
      },
      completed: {
        variant: "outline" as const,
        icon: CheckCircle,
        bgColor: "bg-gradient-to-r from-blue-400 to-purple-500",
        textColor: "text-white",
      },
    }

    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <div
        className={`flex items-center gap-1 w-fit text-xs px-3 py-1.5 rounded-full ${config.bgColor} ${config.textColor} font-medium shadow-sm`}
      >
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 p-3 md:p-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gradient-to-r from-purple-200 to-pink-200 rounded-md w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gradient-to-r from-indigo-200 to-blue-200 rounded-md w-96 animate-pulse"></div>
          </div>

          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border-l-4 border-l-gradient-to-b from-cyan-400 to-blue-500">
                <CardContent className="px-6 py-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-40"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48"></div>
                    </div>
                    <div className="h-5 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full w-16"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 p-3 md:p-4">
        <div className="max-w-5xl mx-auto">
          <Alert className="border-red-300 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 p-3 md:p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
            Notifications
          </h1>
          <p className="text-gray-700 text-base">
            {appointments.length > 0
              ? `You have ${appointments.length} unseen appointment${appointments.length === 1 ? "" : "s"}`
              : "All caught up! No new notifications."}
          </p>
        </div>

        {appointments.length > 0 && (
          <div className="mb-4 flex justify-end">
            <Button
              onClick={markAllAsSeen}
              disabled={markingAllAsSeen || appointments.every((apt) => seenNotifications.has(apt.id))}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="sm"
            >
              {markingAllAsSeen ? "Marking..." : "Mark All as Seen"}
            </Button>
          </div>
        )}

        {/* Notifications List */}
        {appointments.length === 0 ? (
          <Card className="text-center py-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
            <CardContent>
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                    All caught up!
                  </h3>
                  <p className="text-gray-600 text-sm">No unseen appointments at the moment.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {appointments.map((apt, index) => {
              const { date, time } = formatDate(apt.date)
              const cardColors = [
                "border-l-gradient-to-b from-cyan-400 to-blue-500",
                "border-l-gradient-to-b from-pink-400 to-rose-500",
                "border-l-gradient-to-b from-green-400 to-emerald-500",
                "border-l-gradient-to-b from-purple-400 to-indigo-500",
                "border-l-gradient-to-b from-orange-400 to-red-500",
              ]
              const borderColor = cardColors[index % cardColors.length]

              return (
                <Card
                  key={apt.id}
                  className={`hover:shadow-xl transition-all duration-300 border-l-4 ${borderColor} bg-gradient-to-r from-white to-gray-50/50 backdrop-blur-sm mb-6 shadow-lg hover:scale-[1.02] ${
                    seenNotifications.has(apt.id) ? "opacity-60 bg-gradient-to-r from-gray-100 to-gray-200/50" : ""
                  }`}
                >
                  <CardContent className="px-6 py-3">
                    <div className="flex-row flex items-start justify-between gap-4">
                      {/* Main Content */}
                      <div className="flex-1 space-y-2">
                        {/* Patient Info */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 text-base">{apt.patient.name}</h3>
                            <div className="flex items-center gap-1 text-gray-600 mt-0">
                              <Mail className="w-3 h-3 text-pink-500" />
                              <span className="text-xs truncate">{apt.patient.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Appointment Details */}
                        <div className="grid-cols-2 grid gap-4 pl-10">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Calendar className="w-3 h-3 text-purple-500" />
                            <span className="text-xs font-medium">{date}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-700">
                            <Clock className="w-3 h-3 text-indigo-500" />
                            <span className="text-xs font-medium">{time}</span>
                          </div>
                        </div>

                        {/* Description */}
                        {apt.description && (
                          <div className="pl-10">
                            <p className="text-gray-700 text-xs leading-relaxed bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-1 rounded border border-blue-100">
                              {apt.description}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Status and Actions */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {getStatusBadge(apt.status)}
                        {!seenNotifications.has(apt.id) && (
                          <Button
                            onClick={() => markAsSeen(apt.id)}
                            disabled={markingAsSeen === apt.id}
                            className="bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white text-xs px-3 py-1 h-auto shadow-md hover:shadow-lg transition-all duration-200"
                            size="sm"
                          >
                            {markingAsSeen === apt.id ? "..." : "Mark as Seen"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
