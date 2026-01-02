// Types

export type MoruErrorCode =
  | 'UNAUTHENTICATED'
  | 'UNAUTHORIZED'
  | 'INVALID_PARAMETERS'
  | 'INTERNAL_SERVER_ERROR'
  | 'API_ERROR'
  | 'UNKNOWN'
  | string

export class MoruError extends Error {
  public code: MoruErrorCode

  constructor(code: MoruErrorCode, message: string) {
    super(message)
    this.name = 'MoruError'
    this.code = code
  }
}

// Errors

export const UnauthenticatedError = () =>
  new MoruError('UNAUTHENTICATED', 'User not authenticated')

export const UnauthorizedError = (message: string) =>
  new MoruError('UNAUTHORIZED', message)

export const InvalidApiKeyError = (message: string) =>
  new MoruError('INVALID_API_KEY', message)

export const InvalidParametersError = (message: string) =>
  new MoruError('INVALID_PARAMETERS', message)

export const ApiError = (message: string) => new MoruError('API_ERROR', message)

export const UnknownError = (message?: string) =>
  new MoruError(
    'UNKNOWN',
    message ??
      'An Unexpected Error Occurred, please try again. If the problem persists, please contact support.'
  )
