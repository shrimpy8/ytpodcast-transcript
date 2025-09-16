/**
 * YouTube video metadata
 */
export interface VideoMetadata {
  id: string
  title: string
  url: string
  publishedAt: string
  duration?: number
  thumbnail?: string
  channelTitle?: string
  description?: string
}

/**
 * Transcript segment with timing information
 */
export interface TranscriptSegment {
  text: string
  start: number
  duration: number
  speaker?: string
}

/**
 * Processed transcript with speaker detection
 */
export interface ProcessedTranscript {
  segments: TranscriptSegment[]
  speakers: string[]
  totalDuration: number
  wordCount: number
}

/**
 * Processing job status
 */
export interface ProcessingJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  videoCount: number
  processedCount: number
  error?: string
  createdAt: Date
  completedAt?: Date
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Video processing request
 */
export interface VideoProcessingRequest {
  url: string
  type: 'single' | 'channel' | 'playlist'
  options?: {
    maxVideos?: number
    includeMetadata?: boolean
    speakerDetection?: boolean
    deduplication?: boolean
  }
}

/**
 * Channel/Playlist information
 */
export interface ChannelInfo {
  id: string
  title: string
  url: string
  videoCount: number
  videos: VideoMetadata[]
}

/**
 * Export format options
 */
export type ExportFormat = 'txt' | 'json' | 'srt' | 'vtt'

/**
 * Export request
 */
export interface ExportRequest {
  transcriptId: string
  format: ExportFormat
  includeMetadata?: boolean
  includeTimestamps?: boolean
}

/**
 * User preferences
 */
export interface UserPreferences {
  defaultExportFormat: ExportFormat
  autoSpeakerDetection: boolean
  autoDeduplication: boolean
  maxVideosPerBatch: number
  theme: 'light' | 'dark' | 'system'
}

/**
 * Error types for better error handling
 */
export enum ErrorType {
  INVALID_URL = 'INVALID_URL',
  VIDEO_NOT_FOUND = 'VIDEO_NOT_FOUND',
  NO_TRANSCRIPT = 'NO_TRANSCRIPT',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Custom error class with type information
 */
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Processing options for transcript enhancement
 */
export interface ProcessingOptions {
  speakerDetection: boolean
  deduplication: boolean
  removeTimestamps: boolean
  normalizeText: boolean
  maxSegmentLength: number
}

/**
 * Batch processing configuration
 */
export interface BatchConfig {
  batchSize: number
  delayBetweenBatches: number
  maxConcurrent: number
  retryAttempts: number
}
