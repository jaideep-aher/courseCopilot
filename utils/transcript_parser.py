"""
Transcript PDF parser for Course Co-Pilot.
Uses a SINGLE OpenAI GPT-4o vision call with all pages to extract ALL courses.
Handles scanned images, tables, and any format.
"""
import base64
import io
import json
import re
from typing import List, Optional

import openai
import pdfplumber
from pdf2image import convert_from_bytes

from models.schemas import TranscriptCourse, TranscriptParseResult
from core.config import settings


TRANSCRIPT_EXTRACTION_PROMPT = """\
You are analyzing a complete student transcript (all pages shown above). \
Extract ALL information you can see across every page.

Return ONLY valid JSON with this structure:
{
  "university_name": "Full university name, or null",
  "student_name": "Student name, or null",
  "student_id": "Student ID, or null",
  "degree_program": "Degree program / major, or null",
  "courses": [
    {
      "course_code": "DEPT 123",
      "course_name": "Full Course Title",
      "credits": 3.0,
      "grade": "A",
      "semester": "Fall 2023"
    }
  ],
  "gpa_info": {
    "cumulative_gpa": null,
    "total_credits_earned": null,
    "total_credits_attempted": null
  },
  "additional_info": "Any other notable info (honors, standing, transfer notes, etc.) or null"
}

IMPORTANT RULES:
- Extract EVERY course from ALL pages — do not stop early
- Include courses with any status: completed, in-progress, withdrawn, transfer, etc.
- If a field is unclear or not present, use null — do NOT skip the course
- For grades: include letter grades, P/F, W, I, IP (in progress), TR (transfer), etc.
- Preserve exact course codes and titles as shown
- Deduplicate if the same course appears on multiple pages
- Return ONLY the JSON, no other text
"""


class TranscriptParser:
    """Parses student transcript PDFs using a single GPT-4o vision call."""

    def __init__(self, openai_client: Optional[openai.OpenAI] = None):
        self.client = openai_client

    def parse(self, pdf_bytes: bytes) -> TranscriptParseResult:
        """Parse a transcript PDF. Uses vision if available, else text fallback."""
        if self.client:
            return self._parse_with_vision(pdf_bytes)
        else:
            return self._parse_with_text(pdf_bytes, [
                "OpenAI client not available. Using text-only extraction (less accurate)."
            ])

    def _parse_with_vision(self, pdf_bytes: bytes) -> TranscriptParseResult:
        """Send ALL pages as images in ONE GPT-4o call."""
        warnings = []

        # Convert PDF pages to images (lower DPI to save tokens)
        try:
            images = convert_from_bytes(pdf_bytes, dpi=150)
        except Exception as e:
            warnings.append(f"Could not convert PDF to images: {e}. Falling back to text extraction.")
            return self._parse_with_text(pdf_bytes, warnings)

        if not images:
            return TranscriptParseResult(
                source_university="Unknown", courses=[],
                raw_text_preview="", confidence="low",
                warnings=["PDF has no pages."],
            )

        # Build message content: all page images + one prompt
        content = []
        # Limit to 20 pages max to stay within token limits
        pages_to_send = images[:20]
        if len(images) > 20:
            warnings.append(f"Transcript has {len(images)} pages. Only the first 20 were analyzed.")

        print(f"  Sending {len(pages_to_send)} transcript pages to GPT-4o vision (single call)...")
        for i, img in enumerate(pages_to_send):
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=80)
            img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{img_b64}",
                    "detail": "high",
                },
            })

        content.append({"type": "text", "text": TRANSCRIPT_EXTRACTION_PROMPT})

        # Single API call for the entire transcript
        try:
            response = self.client.chat.completions.create(
                model=settings.vision_model,
                max_tokens=8000,
                messages=[{"role": "user", "content": content}],
            )
            text = response.choices[0].message.content.strip()
            parsed = self._parse_json(text)
        except Exception as e:
            warnings.append(f"Vision extraction failed: {e}. Trying text fallback.")
            return self._parse_with_text(pdf_bytes, warnings)

        if not parsed:
            warnings.append("Could not parse vision response. Trying text fallback.")
            return self._parse_with_text(pdf_bytes, warnings)

        return self._build_result(parsed, warnings)

    def _parse_with_text(self, pdf_bytes: bytes, warnings: List[str]) -> TranscriptParseResult:
        """Fallback: extract text with pdfplumber and send to GPT."""
        pages_text = []
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        pages_text.append(text)
        except Exception as e:
            warnings.append(f"PDF text extraction error: {e}")

        if not pages_text:
            return TranscriptParseResult(
                source_university="Unknown", courses=[],
                raw_text_preview="", confidence="low",
                warnings=warnings + ["Could not extract text from PDF."],
            )

        full_text = "\n\n--- PAGE BREAK ---\n\n".join(pages_text)

        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=settings.research_model,
                    max_tokens=8000,
                    messages=[{
                        "role": "user",
                        "content": f"{TRANSCRIPT_EXTRACTION_PROMPT}\n\nTranscript text:\n{full_text[:15000]}",
                    }],
                )
                text = response.choices[0].message.content.strip()
                parsed = self._parse_json(text)
                if parsed:
                    return self._build_result(parsed, warnings)
            except Exception as e:
                warnings.append(f"GPT text parsing failed: {e}")

        return TranscriptParseResult(
            source_university="Unknown", courses=[],
            raw_text_preview=full_text[:500], confidence="low",
            warnings=warnings + ["Could not parse courses from transcript text."],
        )

    def _build_result(self, parsed: dict, warnings: List[str]) -> TranscriptParseResult:
        """Convert parsed JSON dict into a TranscriptParseResult."""
        university = parsed.get("university_name") or "Unknown"

        courses = []
        for c in parsed.get("courses", []):
            if not c.get("course_code") and not c.get("course_name"):
                continue
            courses.append(TranscriptCourse(
                course_code=c.get("course_code", ""),
                course_name=c.get("course_name", ""),
                credits=self._safe_float(c.get("credits")),
                grade=c.get("grade"),
                semester=c.get("semester"),
                source_university=university,
            ))

        confidence = "high" if len(courses) >= 5 else "medium" if len(courses) >= 1 else "low"
        if university == "Unknown":
            warnings.append("Could not detect university name.")
            if confidence == "high":
                confidence = "medium"

        raw_preview = json.dumps(parsed, indent=2)[:1000]

        return TranscriptParseResult(
            source_university=university,
            courses=courses,
            raw_text_preview=raw_preview,
            confidence=confidence,
            warnings=warnings,
            student_name=parsed.get("student_name"),
            student_id=parsed.get("student_id"),
            degree_program=parsed.get("degree_program"),
            gpa_info=parsed.get("gpa_info"),
            additional_info=parsed.get("additional_info"),
        )

    def _parse_json(self, text: str):
        """Parse JSON from LLM response, handling markdown code blocks."""
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except json.JSONDecodeError:
                    pass
            return None

    def _safe_float(self, val) -> Optional[float]:
        if val is None:
            return None
        try:
            return float(val)
        except (ValueError, TypeError):
            return None
