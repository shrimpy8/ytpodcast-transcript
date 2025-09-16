import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, ProcessingJob, ErrorType } from '@/types'

/**
 * In-memory job storage (in production, use Redis or database)
 * This should be the same instance as in the batch route
 */
const jobs = new Map<string, ProcessingJob>()

/**
 * GET /api/transcript/batch/[jobId]
 * Get batch processing status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { jobId } = await params
    
    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Missing job ID',
        message: 'Job ID is required'
      }, { status: 400 })
    }
    
    const job = jobs.get(jobId)
    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found',
        message: 'Processing job not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: job
    })

  } catch (error) {
    console.error('Get batch status error:', error)
    
    return NextResponse.json({
      success: false,
      error: ErrorType.UNKNOWN,
      message: 'An unexpected error occurred while fetching job status'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/transcript/batch/[jobId]
 * Cancel batch processing job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { jobId } = await params
    
    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Missing job ID',
        message: 'Job ID is required'
      }, { status: 400 })
    }
    
    const job = jobs.get(jobId)
    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found',
        message: 'Processing job not found'
      }, { status: 404 })
    }

    if (job.status === 'processing') {
      job.status = 'failed'
      job.error = 'Job cancelled by user'
      jobs.set(jobId, job)
    }

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully'
    })

  } catch (error) {
    console.error('Cancel batch error:', error)
    
    return NextResponse.json({
      success: false,
      error: ErrorType.UNKNOWN,
      message: 'An unexpected error occurred while cancelling the job'
    }, { status: 500 })
  }
}
