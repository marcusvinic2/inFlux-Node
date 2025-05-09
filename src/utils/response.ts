interface ResponseData {
  type: string
  message: string
  details?: string
}

class ResponseMessage {
  static getMessage(type: string, message: string, details = ''): ResponseData {
    return {
      type,
      message,
      details: details || undefined,
    }
  }
}

export default ResponseMessage
