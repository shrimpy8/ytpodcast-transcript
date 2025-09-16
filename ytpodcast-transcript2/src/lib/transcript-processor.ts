import { TranscriptSegment, ProcessedTranscript, ProcessingOptions } from '@/types'

/**
 * Advanced transcript processing utilities
 * Ported from the Python logic in the original shell script
 */

/**
 * Cleans and normalizes transcript text
 * @param text - Raw transcript text
 * @returns Cleaned text
 */
export function cleanTranscriptText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/\[.*?\]/g, '') // Remove brackets content
    .replace(/\(.*?\)/g, '') // Remove parentheses content
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Aggressive deduplication algorithm
 * Ported from the Python implementation in the shell script
 * @param segments - Array of transcript segments
 * @returns Deduplicated segments
 */
export function aggressiveDeduplication(segments: TranscriptSegment[]): TranscriptSegment[] {
  if (!segments.length) return []

  // Join all segments into full text
  const fullText = segments.map(s => s.text).join(' ')
  
  // Step 1: Remove repeated arrows and formatting artifacts
  let cleanedText = fullText
    .replace(/(>>\s*)+/g, '>> ')
    .replace(/(\*\*[^*]*\*\*:\s*)+/g, '')
  
  // Step 2: Aggressive phrase deduplication
  // Remove sequences of 2+ repeated words
  for (let i = 10; i >= 2; i--) {
    const pattern = new RegExp(`\\b((?:\\w+\\s+){${i-1}}\\w+)(?:\\s+\\1)+\\b`, 'gi')
    cleanedText = cleanedText.replace(pattern, '$1')
  }
  
  // Step 3: Remove immediate word repetitions
  cleanedText = cleanedText.replace(/\b(\w+)\s+\1\b/gi, '$1')
  
  // Step 4: Clean up multiple spaces
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim()
  
  // Step 5: Split into sentences and remove duplicates
  const sentences = cleanedText.split(/[.!?]+/)
  const uniqueSentences: string[] = []
  const seenNormalized = new Set<string>()
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (trimmed.length < 8) continue // Skip very short fragments
    
    // Normalize for comparison
    const normalized = trimmed
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
    
    if (normalized && normalized.length > 10 && !seenNormalized.has(normalized)) {
      uniqueSentences.push(trimmed)
      seenNormalized.add(normalized)
    }
  }
  
  // Reconstruct segments with deduplicated content
  return reconstructSegments(uniqueSentences, segments)
}

/**
 * Reconstructs segments from deduplicated sentences
 * @param sentences - Deduplicated sentences
 * @param originalSegments - Original segments for timing reference
 * @returns Reconstructed segments
 */
function reconstructSegments(sentences: string[], originalSegments: TranscriptSegment[]): TranscriptSegment[] {
  const result: TranscriptSegment[] = []
  let currentIndex = 0
  
  for (const sentence of sentences) {
    if (currentIndex < originalSegments.length) {
      result.push({
        ...originalSegments[currentIndex],
        text: sentence
      })
      currentIndex++
    }
  }
  
  return result
}

/**
 * Speaker detection patterns
 * Ported from the Python implementation
 */
const HOST_PATTERNS = [
  'welcome back',
  'thanks for joining',
  'can you tell us',
  'so tell me',
  'that\'s interesting',
  'before we',
  'moving on',
  'let me ask',
  'i\'m so happy',
  'okay tom',
  'got it',
  'this is super interesting'
]

const GUEST_PATTERNS = [
  'thanks for having me',
  'absolutely',
  'what i did',
  'well thanks',
  'i think it\'s',
  'in my experience',
  'what we found',
  'the way i',
  'yeah i think',
  'i wrote this',
  'so i initially'
]

/**
 * Detects speaker based on content patterns
 * @param text - Text to analyze
 * @returns Detected speaker or null
 */
export function detectSpeaker(text: string): string | null {
  const lowerText = text.toLowerCase()
  
  // Check for host patterns
  for (const pattern of HOST_PATTERNS) {
    if (lowerText.includes(pattern)) {
      return 'Host'
    }
  }
  
  // Check for guest patterns
  for (const pattern of GUEST_PATTERNS) {
    if (lowerText.includes(pattern)) {
      return 'Guest'
    }
  }
  
  return null
}

/**
 * Formats transcript with speaker detection
 * @param segments - Transcript segments
 * @returns Formatted transcript with speaker labels
 */
export function formatWithSpeakers(segments: TranscriptSegment[]): string {
  if (!segments.length) return ''
  
  const formattedParts: string[] = []
  let currentSpeaker: string | null = null
  const paragraphBuffer: string[] = []
  
  for (const segment of segments) {
    const text = segment.text.trim()
    if (!text) continue
    
    // Detect speaker based on content
    const newSpeaker = detectSpeaker(text)
    
    // Add speaker label if changed or starting
    if (newSpeaker !== currentSpeaker) {
      // Flush previous paragraph
      if (paragraphBuffer.length) {
        formattedParts.push(paragraphBuffer.join(' '))
        paragraphBuffer.length = 0
      }
      
      if (newSpeaker) {
        formattedParts.push(`\n\n**${newSpeaker}**: ${text}`)
        currentSpeaker = newSpeaker
      } else {
        paragraphBuffer.push(text)
      }
    } else {
      paragraphBuffer.push(text)
    }
  }
  
  // Flush remaining buffer
  if (paragraphBuffer.length) {
    formattedParts.push(paragraphBuffer.join(' '))
  }
  
  return formattedParts.join('')
}

/**
 * Main transcript processing function
 * @param segments - Raw transcript segments
 * @param options - Processing options
 * @returns Processed transcript
 */
export function processTranscript(
  segments: TranscriptSegment[],
  options: ProcessingOptions = {
    speakerDetection: true,
    deduplication: true,
    removeTimestamps: false,
    normalizeText: true,
    maxSegmentLength: 1000
  }
): ProcessedTranscript {
  let processedSegments = [...segments]
  
  // Clean and normalize text
  if (options.normalizeText) {
    processedSegments = processedSegments.map(segment => ({
      ...segment,
      text: cleanTranscriptText(segment.text)
    }))
  }
  
  // Apply deduplication
  if (options.deduplication) {
    processedSegments = aggressiveDeduplication(processedSegments)
  }
  
  // Detect speakers
  if (options.speakerDetection) {
    processedSegments = processedSegments.map(segment => ({
      ...segment,
      speaker: detectSpeaker(segment.text) || segment.speaker
    }))
  }
  
  // Calculate statistics
  const totalDuration = processedSegments.reduce((sum, segment) => sum + segment.duration, 0)
  const wordCount = processedSegments.reduce((sum, segment) => 
    sum + segment.text.split(/\s+/).length, 0
  )
  const speakers = Array.from(new Set(
    processedSegments
      .map(s => s.speaker)
      .filter(Boolean)
  )) as string[]
  
  return {
    segments: processedSegments,
    speakers,
    totalDuration,
    wordCount
  }
}

/**
 * Exports transcript in various formats
 * @param transcript - Processed transcript
 * @param format - Export format
 * @param includeMetadata - Whether to include metadata
 * @returns Formatted transcript string
 */
export function exportTranscript(
  transcript: ProcessedTranscript,
  format: 'txt' | 'json' | 'srt' | 'vtt',
  includeMetadata: boolean = true
): string {
  switch (format) {
    case 'txt':
      return exportAsText(transcript, includeMetadata)
    case 'json':
      return exportAsJson(transcript, includeMetadata)
    case 'srt':
      return exportAsSrt(transcript)
    case 'vtt':
      return exportAsVtt(transcript)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Export as plain text
 */
function exportAsText(transcript: ProcessedTranscript, includeMetadata: boolean): string {
  let result = ''
  
  if (includeMetadata) {
    result += `# Transcript\n`
    result += `Total Duration: ${formatDuration(transcript.totalDuration)}\n`
    result += `Word Count: ${transcript.wordCount}\n`
    result += `Speakers: ${transcript.speakers.join(', ')}\n\n`
  }
  
  result += formatWithSpeakers(transcript.segments)
  result += '\n\n---\n'
  result += '*Note: Speaker identification is automated and may not be 100% accurate.*\n'
  
  return result
}

/**
 * Export as JSON
 */
function exportAsJson(transcript: ProcessedTranscript, includeMetadata: boolean): string {
  const exportData = {
    ...(includeMetadata && {
      metadata: {
        totalDuration: transcript.totalDuration,
        wordCount: transcript.wordCount,
        speakers: transcript.speakers,
        segmentCount: transcript.segments.length
      }
    }),
    segments: transcript.segments
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * Export as SRT format
 */
function exportAsSrt(transcript: ProcessedTranscript): string {
  return transcript.segments
    .map((segment, index) => {
      const start = formatSrtTime(segment.start)
      const end = formatSrtTime(segment.start + segment.duration)
      return `${index + 1}\n${start} --> ${end}\n${segment.text}\n`
    })
    .join('\n')
}

/**
 * Export as VTT format
 */
function exportAsVtt(transcript: ProcessedTranscript): string {
  let result = 'WEBVTT\n\n'
  
  result += transcript.segments
    .map(segment => {
      const start = formatVttTime(segment.start)
      const end = formatVttTime(segment.start + segment.duration)
      return `${start} --> ${end}\n${segment.text}\n`
    })
    .join('\n')
  
  return result
}

/**
 * Format time for SRT
 */
function formatSrtTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
}

/**
 * Format time for VTT
 */
function formatVttTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}

/**
 * Format duration helper
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
