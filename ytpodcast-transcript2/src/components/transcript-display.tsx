'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// import { Progress } from '@/components/ui/progress' // Unused for now
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  Copy, 
  FileText, 
  Clock, 
  Users, 
  Hash,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { ProcessedTranscript, ExportFormat } from '@/types'
import { formatDuration } from '@/lib/utils'

interface TranscriptDisplayProps {
  transcript: ProcessedTranscript
  metadata?: {
    videoId: string
    url: string
    title?: string
    channelTitle?: string
    publishedAt?: string
    processedAt: string
  }
  onExport: (format: ExportFormat) => void
  isExporting?: boolean
}

/**
 * Transcript Display Component
 * Shows processed transcript with metadata and export options
 */
export function TranscriptDisplay({ 
  transcript, 
  metadata, 
  onExport, 
  isExporting = false 
}: TranscriptDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [showFullTranscript, setShowFullTranscript] = useState(false)

  const handleCopy = async () => {
    const text = transcript.segments.map(segment => {
      const speaker = segment.speaker ? `**${segment.speaker}**: ` : ''
      return `${speaker}${segment.text}`
    }).join('\n\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const displayedSegments = showFullTranscript 
    ? transcript.segments 
    : transcript.segments.slice(0, 10)

  const exportFormats: { format: ExportFormat; label: string; description: string }[] = [
    { format: 'txt', label: 'Text', description: 'Plain text with speaker labels' },
    { format: 'json', label: 'JSON', description: 'Structured data with metadata' },
    { format: 'srt', label: 'SRT', description: 'Subtitle format with timestamps' },
    { format: 'vtt', label: 'WebVTT', description: 'Web video text track format' }
  ]

  return (
    <div className="space-y-6">
      {/* Metadata Card */}
      {metadata && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Video Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Video ID</h4>
                <p className="font-mono text-sm">{metadata.videoId}</p>
              </div>
              {metadata.title && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Title</h4>
                  <p className="text-sm">{metadata.title}</p>
                </div>
              )}
              {metadata.channelTitle && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Channel</h4>
                  <p className="text-sm">{metadata.channelTitle}</p>
                </div>
              )}
              {metadata.publishedAt && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Published</h4>
                  <p className="text-sm">{new Date(metadata.publishedAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Transcript Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Duration</span>
              </div>
              <p className="text-lg font-bold">{formatDuration(transcript.totalDuration)}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Words</span>
              </div>
              <p className="text-lg font-bold">{transcript.wordCount.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Speakers</span>
              </div>
              <p className="text-lg font-bold">{transcript.speakers.length}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Segments</span>
              </div>
              <p className="text-lg font-bold">{transcript.segments.length}</p>
            </div>
          </div>
          
          {/* Speakers */}
          {transcript.speakers.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Detected Speakers</h4>
              <div className="flex flex-wrap gap-2">
                {transcript.speakers.map((speaker, index) => (
                  <Badge key={index} variant="secondary">
                    {speaker}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Options
          </CardTitle>
          <CardDescription>
            Download the transcript in various formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exportFormats.map(({ format, label, description }) => (
              <Button
                key={format}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => onExport(format)}
                disabled={isExporting}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium">{label}</span>
                  {isExporting && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  {description}
                </span>
              </Button>
            ))}
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={copied}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Text
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transcript Content */}
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
          <CardDescription>
            Processed transcript with speaker detection and deduplication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayedSegments.map((segment, index) => (
              <div key={index} className="border-l-2 border-muted pl-4">
                {segment.speaker && (
                  <Badge variant="outline" className="mb-2">
                    {segment.speaker}
                  </Badge>
                )}
                <p className="text-sm leading-relaxed">{segment.text}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(segment.start)}</span>
                  <span>•</span>
                  <span>{formatDuration(segment.duration)}</span>
                </div>
              </div>
            ))}
            
            {!showFullTranscript && transcript.segments.length > 10 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFullTranscript(true)}
                >
                  Show All {transcript.segments.length} Segments
                </Button>
              </div>
            )}
          </div>
          
          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Speaker identification is automated and may not be 100% accurate. 
              The transcript has been processed to remove duplicates and formatting artifacts.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
