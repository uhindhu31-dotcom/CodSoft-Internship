import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const maximumExtractedTextLength = 100_000;

export class ResumeParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeParseError";
  }
}

export async function extractResumeText(
  fileType: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "text/plain",
  content: Buffer,
) {
  let text: string;
  if (fileType === "text/plain") {
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(content);
    } catch {
      throw new ResumeParseError("The TXT resume must use valid UTF-8 encoding.");
    }
    if (text.includes("\0")) {
      throw new ResumeParseError("The TXT resume contains invalid binary data.");
    }
  } else if (fileType === "application/pdf") {
    if (content.subarray(0, 5).toString("ascii") !== "%PDF-") {
      throw new ResumeParseError("The uploaded file is not a valid PDF document.");
    }
    const parser = new PDFParse({ data: content });
    try {
      text = (await parser.getText()).text.replace(
        /^\s*--\s+\d+\s+of\s+\d+\s+--\s*$/gm,
        "",
      );
    } catch (error) {
      console.error("PDF resume parsing failed.", {
        error: error instanceof Error ? error.name : "UnknownError",
      });
      throw new ResumeParseError("The PDF could not be read. Check that it is not corrupted or password-protected.");
    } finally {
      await parser.destroy();
    }
  } else {
    if (content[0] !== 0x50 || content[1] !== 0x4b) {
      throw new ResumeParseError("The uploaded file is not a valid DOCX document.");
    }
    try {
      const result = await mammoth.extractRawText({ buffer: content });
      if (result.messages.some((message) => message.type === "error")) {
        throw new ResumeParseError("The DOCX document could not be read.");
      }
      text = result.value;
    } catch (error) {
      if (error instanceof ResumeParseError) throw error;
      console.error("DOCX resume parsing failed.", {
        error: error instanceof Error ? error.name : "UnknownError",
      });
      throw new ResumeParseError("The DOCX could not be read. Check that it is not corrupted.");
    }
  }

  const normalizedText = text.replace(/\u0000/g, "").trim();
  if (!normalizedText) {
    throw new ResumeParseError(
      "No selectable text was found in this resume. Scanned PDFs require OCR and are not supported.",
    );
  }
  return normalizedText.slice(0, maximumExtractedTextLength);
}
