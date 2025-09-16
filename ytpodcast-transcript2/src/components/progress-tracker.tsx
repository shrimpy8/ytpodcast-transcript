'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  X
} from 'lucide-react'
import { ProcessingJob } from '@/types'
import { formatDate } from '@/lib/utils'

interface ProgressTrackerProps {
  jobId: string
  onComplete?: (job: ProcessingJob) => void
  onError?: (error: string) => void
  onCancel?: () => void
}

/**
 * Progress Tracker Component
 * Shows real-time progress for batch processing jobs
 */
export function ProgressTracker({ 
  jobId, 
  onComplete, 
  onError, 
  onCancel 
}: ProgressTrackerProps) {
  const [job, setJob] = useState<ProcessingJob | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Poll for job status
  useEffect(() => {
    if (!jobId) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/transcript/batch/${jobId}`)
        const data = await response.json()

        if (data.success) {
          setJob(data.data)
          setIsLoading(false)
          setError(null)

          // Handle completion
          if (data.data.status === 'completed' && onComplete) {
            onComplete(data.data)
            clearInterval(pollInterval)
          }

          // Handle failure
          if (data.data.status === 'failed' && onError) {
            onError(data.data.error || 'Processing failed')
            clearInterval(pollInterval)
          }
        } else {
          setError(data.message || 'Failed to fetch job status')
          setIsLoading(false)
        }
      } catch (err) {
        setError('Network error while checking job status')
        setIsLoading(false)
      }
    }, 1000) // Poll every second

    // Initial fetch
    const initialFetch = async () => {
      try {
        const response = await fetch(`/api/transcript/batch/${jobId}`)
        const data = await response.json()

        if (data.success) {
          setJob(data.data)
          setIsLoading(false)
        } else {
          setError(data.message || 'Failed to fetch job status')
          setIsLoading(false)
        }
      } catch (err) {
        setError('Network error while checking job status')
        setIsLoading(false)
      }
    }

    initialFetch()

    return () => clearInterval(pollInterval)
  }, [jobId, onComplete, onError])

  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/transcript/batch/${jobId}`, {
        method: 'DELETE'
      })
      
      if (response.ok && onCancel) {
        onCancel()
      }
    } catch (err) {
      console.error('Failed to cancel job:', err)
    }
  }

  const getStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading job status...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!job) {
    return (
      <Card>
        <CardContent>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>Job not found</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(job.status)}
            <CardTitle>Processing Job</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(job.status)}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </Badge>
            {job.status === 'processing' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Job ID: {job.id}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{job.progress}%</span>
          </div>
          <Progress value={job.progress} className="w-full" />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Videos Processed:</span>
            <span className="ml-2 font-medium">
              {job.processedCount} / {job.videoCount}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Started:</span>
            <span className="ml-2 font-medium">
              {formatDate(new Date(job.createdAt))}
            </span>
          </div>
        </div>

        {/* Completion Time */}
        {job.completedAt && (
          <div className="text-sm">
            <span className="text-muted-foreground">Completed:</span>
            <span className="ml-2 font-medium">
              {formatDate(new Date(job.completedAt))}
            </span>
          </div>
        )}

        {/* Error Message */}
        {job.status === 'failed' && job.error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{job.error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {job.status === 'completed' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Successfully processed {job.processedCount} videos!
            </AlertDescription>
          </Alert>
        )}

        {/* Processing Details */}
        {job.status === 'processing' && (
          <div className="text-sm text-muted-foreground">
            Processing videos in batches. This may take several minutes depending on the number of videos.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
