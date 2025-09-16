import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { 
  isValidYouTubeUrl, 
  extractVideoId, 
  sanitizeInput
} from '@/lib/utils'
import { 
  processTranscript, 
  exportTranscript 
} from '@/lib/transcript-processor'
import { 
  VideoProcessingRequest, 
  ApiResponse, 
  TranscriptSegment, 
  ProcessedTranscript,
  AppError,
  ErrorType 
} from '@/types'

/**
 * Request validation schema
 */
const transcriptRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  type: z.enum(['single', 'channel', 'playlist']),
  options: z.object({
    maxVideos: z.number().min(1).max(60).optional(),
    includeMetadata: z.boolean().optional(),
    speakerDetection: z.boolean().optional(),
    deduplication: z.boolean().optional(),
    exportFormat: z.enum(['txt', 'json', 'srt', 'vtt']).optional()
  }).optional()
})

/**
 * POST /api/transcript
 * Processes YouTube video(s) and returns transcript
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json()
    
    // Validate request
    const validationResult = transcriptRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format',
        message: validationResult.error.issues.map(e => e.message).join(', ')
      }, { status: 400 })
    }

    const { url, type, options = {} } = validationResult.data

    // Sanitize and validate URL
    const sanitizedUrl = sanitizeInput(url)
    if (!isValidYouTubeUrl(sanitizedUrl)) {
      throw new AppError(ErrorType.INVALID_URL, 'Invalid YouTube URL format')
    }

    // Extract video ID
    const videoId = extractVideoId(sanitizedUrl)
    if (!videoId) {
      throw new AppError(ErrorType.INVALID_URL, 'Could not extract video ID from URL')
    }

    // Process based on type
    let result: ProcessedTranscript
    if (type === 'single') {
      result = await processSingleVideo(videoId, options)
    } else {
      // For now, we'll handle single videos only
      // Channel/playlist processing will be implemented separately
      result = await processSingleVideo(videoId, options)
    }

    // Export in requested format
    const exportFormat = options.exportFormat || 'txt'
    const exportedContent = exportTranscript(result, exportFormat, options.includeMetadata)

    return NextResponse.json({
      success: true,
      data: {
        transcript: result,
        exportedContent,
        format: exportFormat,
        metadata: {
          videoId,
          url: sanitizedUrl,
          processedAt: new Date().toISOString(),
          wordCount: result.wordCount,
          duration: result.totalDuration,
          speakers: result.speakers
        }
      }
    })

  } catch (error) {
    console.error('Transcript processing error:', error)
    
    if (error instanceof AppError) {
      return NextResponse.json({
        success: false,
        error: error.type,
        message: error.message
      }, { status: error.statusCode })
    }

    return NextResponse.json({
      success: false,
      error: ErrorType.UNKNOWN,
      message: 'An unexpected error occurred while processing the transcript'
    }, { status: 500 })
  }
}

/**
 * Processes a single video transcript
 */
async function processSingleVideo(
  videoId: string, 
  options: VideoProcessingRequest['options'] = {}
): Promise<ProcessedTranscript> {
  try {
    // Create temporary directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yt-transcript-'))
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    
    // Download subtitle using yt-dlp (same as shell script)
    const srtFile = await downloadSubtitle(videoUrl, videoId, tempDir)
    
    if (!srtFile) {
      throw new AppError(ErrorType.NO_TRANSCRIPT, 'No transcript available for this video')
    }

    // Parse SRT file
    const segments = await parseSRTFile(srtFile)
    
    // Clean up temporary files
    await fs.rm(tempDir, { recursive: true, force: true })

    if (!segments || segments.length === 0) {
      throw new AppError(ErrorType.NO_TRANSCRIPT, 'No transcript available for this video')
    }

    // Process transcript with options
    const processingOptions = {
      speakerDetection: options.speakerDetection ?? true,
      deduplication: options.deduplication ?? true,
      removeTimestamps: false,
      normalizeText: true,
      maxSegmentLength: 1000
    }

    return processTranscript(segments, processingOptions)

  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    // Handle YouTube transcript API errors
    if (error instanceof Error) {
      if (error.message.includes('Video unavailable')) {
        throw new AppError(ErrorType.VIDEO_NOT_FOUND, 'Video not found or unavailable')
      }
      if (error.message.includes('Transcript not available')) {
        throw new AppError(ErrorType.NO_TRANSCRIPT, 'No transcript available for this video')
      }
    }

    throw new AppError(ErrorType.PROCESSING_ERROR, 'Failed to process video transcript')
  }
}

/**
 * Downloads subtitle using yt-dlp (same approach as shell script)
 */
async function downloadSubtitle(videoUrl: string, videoId: string, tempDir: string): Promise<string | null> {
  return new Promise((resolve) => {
    const args = [
      '--write-auto-subs',
      '--skip-download',
      '--sub-lang', 'en',
      '--convert-subs', 'srt',
      '--sub-format', 'best[ext=srt]',
      '-o', path.join(tempDir, '%(id)s.%(ext)s'),
      videoUrl
    ]

    const ytdlp = spawn('yt-dlp', args, { stdio: 'pipe' })
    
    let stderr = ''
    ytdlp.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    ytdlp.on('close', async (code) => {
      if (code !== 0) {
        console.error('yt-dlp error:', stderr)
        resolve(null)
        return
      }

      // Find the downloaded subtitle file
      const possibleFiles = [
        path.join(tempDir, `${videoId}.srt`),
        path.join(tempDir, `${videoId}.en.srt`)
      ]

      for (const file of possibleFiles) {
        try {
          await fs.access(file)
          resolve(file)
          return
        } catch {
          // File doesn't exist, try next
        }
      }

      resolve(null)
    })

    ytdlp.on('error', (error) => {
      console.error('yt-dlp spawn error:', error)
      resolve(null)
    })
  })
}

/**
 * Parses SRT file and converts to segments
 */
async function parseSRTFile(srtFile: string): Promise<TranscriptSegment[]> {
  try {
    const content = await fs.readFile(srtFile, 'utf-8')
    const segments: TranscriptSegment[] = []
    
    // Parse SRT format
    const blocks = content.split('\n\n').filter(block => block.trim())
    
    for (const block of blocks) {
      const lines = block.trim().split('\n')
      if (lines.length < 3) continue
      
      // Parse timestamp line (format: 00:00:00,000 --> 00:00:05,000)
      const timestampLine = lines[1]
      const timestampMatch = timestampLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/)
      
      if (!timestampMatch) continue
      
      const startTime = parseSRTTime(timestampMatch[1])
      const endTime = parseSRTTime(timestampMatch[2])
      const text = lines.slice(2).join(' ').trim()
      
      if (text) {
        segments.push({
          text,
          start: startTime,
          duration: endTime - startTime
        })
      }
    }
    
    return segments
  } catch (error) {
    console.error('Error parsing SRT file:', error)
    return []
  }
}

/**
 * Parses SRT timestamp format (HH:MM:SS,mmm) to seconds
 */
function parseSRTTime(timeStr: string): number {
  const [time, ms] = timeStr.split(',')
  const [hours, minutes, seconds] = time.split(':').map(Number)
  return hours * 3600 + minutes * 60 + seconds + (Number(ms) / 1000)
}

/**
 * GET /api/transcript
 * Health check endpoint
 */
export async function GET(): Promise<NextResponse<ApiResponse>> {
  return NextResponse.json({
    success: true,
    message: 'Transcript API is running',
    data: {
      version: '1.0.0',
      features: [
        'Single video processing',
        'Speaker detection',
        'Deduplication',
        'Multiple export formats'
      ]
    }
  })
}
