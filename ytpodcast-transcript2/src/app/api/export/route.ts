import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { exportTranscript } from '@/lib/transcript-processor'
import { 
  ApiResponse, 
  AppError,
  ErrorType 
} from '@/types'

/**
 * Request validation schema for export
 */
const exportRequestSchema = z.object({
  transcript: z.object({
    segments: z.array(z.object({
      text: z.string(),
      start: z.number(),
      duration: z.number(),
      speaker: z.string().optional()
    })),
    speakers: z.array(z.string()),
    totalDuration: z.number(),
    wordCount: z.number()
  }),
  format: z.enum(['txt', 'json', 'srt', 'vtt']),
  includeMetadata: z.boolean().default(true),
  includeTimestamps: z.boolean().default(false)
})

/**
 * POST /api/export
 * Exports transcript in various formats
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    
    // Validate request
    const validationResult = exportRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format',
        message: validationResult.error.issues.map(e => e.message).join(', ')
      }, { status: 400 })
    }

    const { transcript, format, includeMetadata } = validationResult.data

    // Export transcript
    const exportedContent = exportTranscript(transcript, format, includeMetadata)

    // Set appropriate headers based on format
    const headers = new Headers()
    const timestamp = new Date().toISOString().split('T')[0]
    
    switch (format) {
      case 'txt':
        headers.set('Content-Type', 'text/plain; charset=utf-8')
        headers.set('Content-Disposition', `attachment; filename="transcript-${timestamp}.txt"`)
        break
      case 'json':
        headers.set('Content-Type', 'application/json; charset=utf-8')
        headers.set('Content-Disposition', `attachment; filename="transcript-${timestamp}.json"`)
        break
      case 'srt':
        headers.set('Content-Type', 'text/plain; charset=utf-8')
        headers.set('Content-Disposition', `attachment; filename="transcript-${timestamp}.srt"`)
        break
      case 'vtt':
        headers.set('Content-Type', 'text/vtt; charset=utf-8')
        headers.set('Content-Disposition', `attachment; filename="transcript-${timestamp}.vtt"`)
        break
    }

    return new NextResponse(exportedContent, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Export error:', error)
    
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
      message: 'An unexpected error occurred while exporting the transcript'
    }, { status: 500 })
  }
}

/**
 * GET /api/export
 * Get available export formats
 */
export async function GET(): Promise<NextResponse<ApiResponse>> {
  return NextResponse.json({
    success: true,
    data: {
      formats: [
        {
          id: 'txt',
          name: 'Plain Text',
          description: 'Clean text format with speaker labels',
          extension: '.txt'
        },
        {
          id: 'json',
          name: 'JSON',
          description: 'Structured data with metadata',
          extension: '.json'
        },
        {
          id: 'srt',
          name: 'SRT Subtitle',
          description: 'Standard subtitle format with timestamps',
          extension: '.srt'
        },
        {
          id: 'vtt',
          name: 'WebVTT',
          description: 'Web video text track format',
          extension: '.vtt'
        }
      ]
    }
  })
}
