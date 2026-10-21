/** Only these errors may expose their actionable message in the export UI. */
export class QuestionPdfError extends Error {
  constructor(message: string, readonly userMessage = message) {
    super(message);
    this.name = "QuestionPdfError";
  }
}
