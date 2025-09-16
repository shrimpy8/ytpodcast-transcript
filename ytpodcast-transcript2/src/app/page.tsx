'use client'

import { useState } from 'react'
import { UrlInput } from '@/components/url-input'
import { TranscriptDisplay } from '@/components/transcript-display'
import { ProgressTracker } from '@/components/progress-tracker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  ProcessedTranscript, 
  ExportFormat, 
  ProcessingJob,
  VideoProcessingRequest 
} from '@/types'
import { 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Download
} from 'lucide-react'

interface ProcessingResult {
  transcript: ProcessedTranscript
  metadata: {
    videoId: string
    url: string
    title?: string
    channelTitle?: string
    publishedAt?: string
    processedAt: string
  }
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [batchJobId, setBatchJobId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUrlSubmit = async (data: VideoProcessingRequest) => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setBatchJobId(null)

    try {
      if (data.type === 'single') {
        // Process single video
        const response = await fetch('/api/transcript', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (result.success) {
          setResult({
            transcript: result.data.transcript,
            metadata: result.data.metadata
          })
        } else {
          setError(result.message || 'Failed to process video')
        }
      } else {
        // Start batch processing
        const response = await fetch('/api/transcript/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (result.success) {
          setBatchJobId(result.data.jobId)
        } else {
          setError(result.message || 'Failed to start batch processing')
        }
      }
    } catch (err) {
      setError('Network error occurred while processing')
      console.error('Processing error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async (format: ExportFormat) => {
    if (!result) return

    setIsExporting(true)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: result.transcript,
          format,
          includeMetadata: true,
          includeTimestamps: format === 'srt' || format === 'vtt'
        }),
      })

      if (response.ok) {
        // Create download link
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transcript-${result.metadata.videoId}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Export failed')
      }
    } catch (err) {
      setError('Network error occurred while exporting')
      console.error('Export error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const handleBatchComplete = (job: ProcessingJob) => {
    // Handle batch processing completion
    console.log('Batch processing completed:', job)
    // TODO: Show results or redirect to results page
  }

  const handleBatchError = (error: string) => {
    setError(error)
    setBatchJobId(null)
  }

  const handleBatchCancel = () => {
    setBatchJobId(null)
  }

  const handleReset = () => {
    setResult(null)
    setBatchJobId(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            YouTube Transcript Downloader
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Download and process YouTube video transcripts with advanced deduplication, 
            speaker detection, and multiple export formats. Perfect for podcast analysis and content research.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Success Message */}
        {result && (
          <div className="max-w-2xl mx-auto mb-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Transcript processed successfully! You can now view, copy, or export the content.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Main Content */}
        {!result && !batchJobId && (
          <UrlInput onSubmit={handleUrlSubmit} isLoading={isLoading} />
        )}

        {/* Batch Processing Progress */}
        {batchJobId && (
          <div className="max-w-2xl mx-auto mb-6">
            <ProgressTracker
              jobId={batchJobId}
              onComplete={handleBatchComplete}
              onError={handleBatchError}
              onCancel={handleBatchCancel}
            />
          </div>
        )}

        {/* Transcript Display */}
        {result && (
          <div className="max-w-4xl mx-auto">
            <TranscriptDisplay
              transcript={result.transcript}
              metadata={result.metadata}
              onExport={handleExport}
              isExporting={isExporting}
            />
          </div>
        )}

        {/* Reset Button */}
        {(result || batchJobId) && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Process Another Video
            </Button>
          </div>
        )}

        {/* Features Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center mb-8 text-slate-900 dark:text-slate-100">
            Advanced Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Multiple Export Formats</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Export transcripts as TXT, JSON, SRT, or WebVTT formats for different use cases.
              </p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">Smart Deduplication</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Advanced algorithms remove repetitive content and formatting artifacts automatically.
              </p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">Speaker Detection</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Automatically identifies and labels Host/Guest speakers based on content patterns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}