from __future__ import annotations

import csv
import html
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


REPO = Path(__file__).resolve().parents[1]
HELP_ROOT = REPO.parent
SOURCE_DIR = HELP_ROOT / "TipSheets" / "TipSheets"
DOCS_DIR = REPO / "docs"
IMAGE_ROOT = REPO / "image-upload-staging"
MANIFEST = REPO / "conversion" / "image-manifest.csv"
INVENTORY = REPO / "conversion" / "tip-sheet-inventory.csv"


@dataclass(frozen=True)
class TipSheet:
    source_name: str
    slug: str
    title: str
    description: str
    category: str
    note: str = ""
    status: str = "converted"


PILOT_SOURCES = {
    "Cornerstone Tip Sheet - Create Material.docx": "content-create-material",
    "Cornerstone Tip Sheet - Test Creation.docx": "content-create-test",
    "Cornerstone Tip Sheet - Learning Assignment Tool.docx": "admin-learning-assignment-tool",
    "Cornerstone Tip Sheet - Grade Checklists.docx": "checklists-grade-checklists",
    "Cornerstone Tip Sheet - Printing Transcript Report.docx": "learner-print-transcript-report",
}


TIP_SHEETS = [
    TipSheet("Auto Assign Dashboard Tip Sheet.docx", "admin-auto-assign-dashboard", "Auto Assign Dashboard", "Use the Auto Assign Dashboard in Cornerstone.", "Admin Guides"),
    TipSheet("Cornerstone Content Development Guidelines.docx", "content-development-guidelines", "Content Development Guidelines", "Review Cornerstone content development standards.", "Content Creation"),
    TipSheet("Cornerstone Tip Sheet - Add a Note (Curriculum).docx", "content-add-curriculum-note", "Add a Curriculum Note", "Add a note to a curriculum in Cornerstone.", "Content Creation"),
    TipSheet("Cornerstone Tip Sheet - Add User.docx", "admin-add-external-user", "Add an External User", "Create an external user profile in Cornerstone.", "Admin Guides"),
    TipSheet("Cornerstone Tip Sheet - Adding Learner to Session Roster.docx", "sessions-add-learner-to-roster", "Add a Learner to a Session Roster", "Add a learner to a session roster in Cornerstone.", "Events and Sessions", "Near-duplicate of Adding Learners to a Session Roster; kept as a separate review page."),
    TipSheet("Cornerstone Tip Sheet - Adding Learners to a Session Roster.docx", "sessions-add-learners-to-roster", "Add Learners to a Session Roster", "Add multiple learners to a session roster in Cornerstone.", "Events and Sessions", "Near-duplicate of Add a Learner to a Session Roster; kept as a separate review page."),
    TipSheet("Cornerstone Tip Sheet - Creating a Video Lesson.docx", "content-create-video-lesson", "Create a Video Lesson", "Create a video lesson in Cornerstone.", "Content Creation"),
    TipSheet("Cornerstone Tip Sheet - Edit Due Dates.docx", "admin-edit-due-dates", "Edit Due Dates", "Edit due dates for training in Cornerstone.", "Admin Guides"),
    TipSheet("Cornerstone Tip Sheet - Edit Session (Date Time Location).docx", "sessions-edit-date-time-location", "Edit Session Date, Time, or Location", "Update the date, time, or location for a Cornerstone session.", "Events and Sessions"),
    TipSheet("Cornerstone Tip Sheet - Edit Validation Details.docx", "checklists-edit-validation-details", "Edit Validation Details", "Edit validation details for checklist items in Cornerstone.", "Tests and Checklists"),
    TipSheet("Cornerstone Tip Sheet - Enroll in Basic Life Support.docx", "learner-enroll-basic-life-support", "Enroll in Basic Life Support", "Self-enroll in Basic Life Support training.", "Learner Guides"),
    TipSheet("Cornerstone Tip Sheet - Enroll in Safety Always.docx", "learner-enroll-safety-always", "Enroll in Safety Always", "Self-enroll in Safety Always training.", "Learner Guides"),
    TipSheet("Cornerstone Tip Sheet - Grading Free Form Essay.docx", "tests-grade-free-form-essay", "Grade a Free Form Essay", "Grade a free form essay response in Cornerstone.", "Tests and Checklists"),
    TipSheet("Cornerstone Tip Sheet - How to Access Previously Completed Training.docx", "learner-access-completed-training", "Access Previously Completed Training", "Find previously completed training in Cornerstone.", "Learner Guides"),
    TipSheet("Cornerstone Tip Sheet - How to Run 'Time Spent' Report.docx", "reports-time-spent", "Run the Time Spent Report", "Run the Time Spent report in Cornerstone.", "Reports and Transcripts"),
    TipSheet("Cornerstone Tip Sheet - Interest Tracking for ITL Admins.docx", "sessions-interest-tracking-ilt-admins", "Track Interest as an ILT Admin", "Review interest tracking for ILT sessions in Cornerstone.", "Events and Sessions"),
    TipSheet("Cornerstone Tip Sheet - Interest Tracking for Sessions.docx", "sessions-interest-tracking", "Track Interest for Sessions", "Use session interest tracking in Cornerstone.", "Events and Sessions"),
    TipSheet("Cornerstone Tip Sheet - Lippincott Professional Development CE Certificate.docx", "learner-lippincott-ce-certificate", "Lippincott Professional Development CE Certificate", "Access a Lippincott Professional Development CE certificate.", "Learner Guides"),
    TipSheet("Cornerstone Tip Sheet - Manager Dashboard.docx", "manager-dashboard", "Manager Dashboard", "Access and use the Manager Dashboard in Cornerstone.", "Manager Guides"),
    TipSheet("Cornerstone Tip Sheet - Marking Session Attendance.docx", "sessions-mark-attendance", "Mark Session Attendance", "Mark learner attendance for a Cornerstone session.", "Events and Sessions"),
    TipSheet("Cornerstone Tip Sheet - Materials_No Signature Required.docx", "content-materials-no-signature-required", "Create Materials with No Signature Required", "Create material learning objects that do not require a signature.", "Content Creation"),
    TipSheet("Cornerstone Tip Sheet - Mobile App.docx", "learner-mobile-app", "Use the Cornerstone Mobile App", "Install and use the Cornerstone mobile app.", "Learner Guides"),
    TipSheet("Cornerstone Tip Sheet - Ongoing Competency 2025 Learning Assignment Tool.docx", "ongoing-competency-2025-learning-assignment-tool", "Ongoing Competency 2025 Learning Assignment Tool", "Use the Learning Assignment Tool for 2025 ongoing competency assignments.", "Ongoing Competency", "Year-specific source retained for review."),
    TipSheet("Cornerstone Tip Sheet - Ongoing Competency 2025 Review.docx", "ongoing-competency-2025-review", "Ongoing Competency 2025 Review", "Review 2025 ongoing competency training in Cornerstone.", "Ongoing Competency", "Year-specific source retained for review."),
    TipSheet("Cornerstone Tip Sheet - Printing Certificate (Admin).docx", "reports-print-certificate-admin", "Print a Certificate as an Admin", "Print a learner certificate as an administrator.", "Reports and Transcripts"),
    TipSheet("Cornerstone Tip Sheet - Printing Certificate (Learner).docx", "learner-print-certificate", "Print a Certificate as a Learner", "Print a certificate from your Cornerstone transcript.", "Learner Guides"),
    TipSheet("Cornerstone Tip Sheet - Printing Certificate from a Curriculum.docx", "learner-print-certificate-from-curriculum", "Print a Certificate from a Curriculum", "Print a certificate from a completed curriculum.", "Learner Guides"),
    TipSheet("Cornerstone Tip Sheet - Printing POCT Transcript Report.docx", "reports-print-poct-transcript", "Print a POCT Transcript Report", "Print a POCT transcript report in Cornerstone.", "Reports and Transcripts"),
    TipSheet("Cornerstone Tip Sheet - Remove Self Requested Training.docx", "learner-remove-self-requested-training", "Remove Self-Requested Training", "Remove self-requested training from your Cornerstone transcript.", "Learner Guides"),
    TipSheet("Cornerstone Tip Sheet - Remove Training.docx", "admin-remove-training", "Remove Training", "Remove training from a learner record in Cornerstone.", "Admin Guides"),
    TipSheet("Cornerstone Tip Sheet - Requesting (self-enroll).docx", "learner-request-training-self-enroll", "Request Training or Self-Enroll", "Request training or self-enroll in Cornerstone.", "Learner Guides"),
    TipSheet("Cornerstone Tip Sheet - Review Test Results.docx", "tests-review-test-results", "Review Test Results", "Review learner test results in Cornerstone.", "Tests and Checklists"),
    TipSheet("Cornerstone Tip Sheet - Run Standard Reports.docx", "reports-run-standard-reports", "Run Standard Reports", "Run standard reports in Cornerstone.", "Reports and Transcripts"),
    TipSheet("Cornerstone Tip Sheet - Tests_AutoPass Option.docx", "tests-autopass-option", "Use the Test AutoPass Option", "Configure the AutoPass option for a Cornerstone test.", "Tests and Checklists"),
    TipSheet("Cornerstone Tip Sheet - View Training Details.docx", "learner-view-training-details", "View Training Details", "View details for a training item in Cornerstone.", "Learner Guides"),
    TipSheet("Cornerstone Tip Sheet - Withdraw from a Session.docx", "sessions-withdraw-from-session", "Withdraw from a Session", "Withdraw from a Cornerstone session.", "Events and Sessions"),
    TipSheet("Pharmacy Certification Upload Tip Sheet.docx", "learner-pharmacy-certification-upload", "Upload a Pharmacy Certification", "Upload a pharmacy certification in Cornerstone.", "Learner Guides"),
]


PDF_ONLY = TipSheet(
    "Cornerstone Tip Sheet - Common Reports.pdf",
    "reports-common-reports",
    "Common Reports",
    "Review common Cornerstone reports and when to use them.",
    "Reports and Transcripts",
    "PDF-only source converted from extracted text; screenshots were not available from a Word source.",
    "converted_pdf_text_only",
)


def ascii_text(value: str) -> str:
    replacements = {
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "-",
        "\u00a0": " ",
        "\u2022": "-",
        "\u2026": "...",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    return value


def clean_markdown(raw: str) -> str:
    raw = ascii_text(raw)
    raw = raw.replace("\\>", ">")
    raw = raw.replace("\\|", "|")
    raw = raw.replace("<!-- -->", "")
    raw = re.sub(r"\n{3,}", "\n\n", raw)
    raw = re.sub(r"[ \t]+\n", "\n", raw)
    raw = re.sub(r"\*\*\*([^*\n][^*]*?)\*\*\*", r"**\1**", raw)
    raw = re.sub(r"\s+([,.;:])", r"\1", raw)
    raw = raw.replace("<LMS@fairview.org>", "LMS@fairview.org")
    raw = raw.replace("LMS@fairview.org.", "LMS@fairview.org")
    raw = re.sub(r"(?im)^\s*>\s*$\n?", "", raw)
    raw = re.sub(r"(?im)^\s*\*\*Cornerstone Tip Sheet\*\*\s*$\n?", "", raw)
    raw = re.sub(r"(?im)^\s*\*?Rev\s+\d{1,2}/\d{1,2}/\d{2,4}\*?\s*$\n?", "", raw)
    raw = re.sub(r"(?i)this tipsheet will show you how to", "This guide explains how to", raw)
    raw = re.sub(r"(?i)this tipsheet will show how to", "This guide explains how to", raw)
    raw = re.sub(r"(?i)in this tipsheet,? we.ll show you to", "This guide explains how to", raw)
    raw = re.sub(r"(?im)^#{1,6}\s+(This guide explains\b.*)$", r"\1", raw)
    raw = re.sub(r"(?im)^this guide explains\b", "This guide explains", raw)
    raw = re.sub(r"(?m)^([^|\n]*[A-Za-z0-9)])\s+\|\s*$", r"\1", raw)
    raw = re.sub(r"\(\s+\)", "", raw)
    return raw.strip()


def image_classes(width: int | None, height: int | None) -> str:
    classes = ["guide-image"]
    if width and height:
        is_tiny = width < 90 or height < 70
        if is_tiny:
            classes.append("guide-image--tiny")
        elif width < 360:
            classes.append("guide-image--small")
        if not is_tiny and width < 460 and height > width * 1.25:
            classes.append("guide-image--phone")
    return " ".join(classes)


ORDERED_MARKER_RE = re.compile(r"^(\s*)(\d+)\.\s*$")
UNORDERED_MARKER_RE = re.compile(r"^\s*[*+-]\s*$")
IMAGE_LINE_RE = re.compile(r"^\s*<img\b[^>]*>\s*$", re.IGNORECASE)


def is_standalone_marker(line: str) -> bool:
    return bool(ORDERED_MARKER_RE.match(line) or UNORDERED_MARKER_RE.match(line))


def normalize_list_image_artifacts(body: str) -> str:
    lines = body.splitlines()
    normalized: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        ordered = ORDERED_MARKER_RE.match(line)
        unordered = UNORDERED_MARKER_RE.match(line)
        if ordered or unordered:
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1

            if unordered:
                i += 1
                continue

            indent, number = ordered.groups()
            if j < len(lines) and IMAGE_LINE_RE.match(lines[j]):
                k = j + 1
                while k < len(lines) and not lines[k].strip():
                    k += 1
                if k < len(lines):
                    candidate = lines[k].strip()
                    if (
                        candidate
                        and not is_standalone_marker(candidate)
                        and not IMAGE_LINE_RE.match(candidate)
                        and not candidate.startswith("#")
                        and not candidate.startswith("<!--")
                    ):
                        normalized.append(f"{indent}{number}. {candidate}")
                        normalized.append("")
                        normalized.append(lines[j])
                        i = k + 1
                        continue
                i = j
                continue

            if j < len(lines):
                candidate = lines[j].strip()
                if (
                    candidate
                    and not is_standalone_marker(candidate)
                    and not IMAGE_LINE_RE.match(candidate)
                    and not candidate.startswith("#")
                    and not candidate.startswith("<!--")
                ):
                    normalized.append(f"{indent}{number}. {candidate}")
                    i = j + 1
                    continue

        normalized.append(line)
        i += 1

    separated: list[str] = []
    for index, line in enumerate(normalized):
        separated.append(line)
        if index + 1 < len(normalized) and IMAGE_LINE_RE.match(line) and normalized[index + 1].strip():
            separated.append("")

    cleaned = "\n".join(separated)
    cleaned = re.sub(r"(?m)^\s*\*\*\s*$\n?", "", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    repaired_lines = []
    for line in cleaned.splitlines():
        if line.count("**") % 2 == 1:
            line = f"{line}**"
        repaired_lines.append(line)
    repaired = "\n".join(repaired_lines)
    repaired = re.sub(r"(?m)^(\s*<img\b[^\n]*>)\n(?!\n)", r"\1\n\n", repaired)
    return repaired.strip()


def remove_support_footer(body: str) -> tuple[str, bool]:
    lines = []
    had_support = False
    skip_next_blank = False
    for line in body.splitlines():
        low = line.lower()
        if "lms@fairview.org" in low or "reach out to the lms team" in low:
            had_support = True
            skip_next_blank = True
            continue
        if skip_next_blank and not line.strip():
            skip_next_blank = False
            continue
        skip_next_blank = False
        lines.append(line)
    return "\n".join(lines).strip(), had_support


def replace_images(raw: str, media_dir: Path, slug: str, title: str) -> tuple[str, list[str]]:
    image_dir = IMAGE_ROOT / slug
    image_dir.mkdir(parents=True, exist_ok=True)
    for old in image_dir.glob("step-*.*"):
        old.unlink()

    images: list[str] = []
    image_index = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal image_index
        tag = match.group(0)
        src_match = re.search(r'src="([^"]+)"', tag)
        alt_match = re.search(r'alt="([^"]*)"', tag)
        if not src_match:
            return ""
        image_index += 1
        src = Path(src_match.group(1))
        if not src.exists():
            src = media_dir / src.name
        dest = image_dir / f"step-{image_index:02d}.png"
        width: int | None = None
        height: int | None = None
        try:
            with Image.open(src) as img:
                width, height = img.size
                img.save(dest)
        except Exception:
            ext = src.suffix.lower() or ".png"
            dest = image_dir / f"step-{image_index:02d}{ext}"
            shutil.copy2(src, dest)
        rel = f"../image-upload-staging/{slug}/{dest.name}"
        manifest_path = f"image-upload-staging/{slug}/{dest.name}"
        images.append(manifest_path)
        alt = html.unescape(alt_match.group(1)).strip() if alt_match else ""
        if not alt or alt.lower().startswith("a screenshot of") or "ai-generated content may be incorrect" in alt.lower():
            alt = f"{title} screenshot {image_index}"
        return f'\n\n   <img class="{image_classes(width, height)}" src="{rel}" alt="{alt}">\n'

    converted = re.sub(r"<img\b.*?>", repl, raw, flags=re.IGNORECASE | re.DOTALL)
    converted = re.sub(r"\n{3,}", "\n\n", converted)
    return converted.strip(), images


def build_article(sheet: TipSheet, body: str, source_label: str, had_support: bool) -> str:
    body, _ = remove_support_footer(body)
    body = body.strip()
    body = re.sub(r"^#+\s+.*tipsheet.*\n+", "", body, flags=re.IGNORECASE)
    body = re.sub(r"^This guide explains how to\s+", "This guide explains how to ", body, flags=re.IGNORECASE)
    body = body.strip()

    if re.match(r"^\d+\.\s", body, flags=re.MULTILINE):
        body = "## Steps\n\n" + body

    notes = ["- Review the source tip sheet if a screenshot or UI label appears out of date."]
    if sheet.note:
        notes.append(f"- {sheet.note}")
    if had_support or True:
        notes.append("- Contact the LMS team at LMS@fairview.org if you have questions about this process.")

    return "\n".join(
        [
            "---",
            f'title: "{sheet.title}"',
            f'description: "{sheet.description}"',
            "---",
            "",
            f"# {sheet.title}",
            "",
            f"Use this guide to {sheet.description[0].lower() + sheet.description[1:].rstrip('.')}.",
            "",
            body,
            "",
            "## Notes",
            "",
            "\n".join(notes),
            "",
            f"<!-- Source: {source_label} -->",
            "",
        ]
    )


def run_pandoc(source: Path, media_dir: Path) -> str:
    cmd = [
        "pandoc",
        str(source),
        "-t",
        "gfm",
        "--wrap=none",
        f"--extract-media={media_dir}",
    ]
    return subprocess.check_output(cmd, text=True, encoding="utf-8", errors="replace")


def convert_docx(sheet: TipSheet) -> tuple[list[str], dict[str, str]]:
    source = SOURCE_DIR / sheet.source_name
    if not source.exists():
        raise FileNotFoundError(source)

    with tempfile.TemporaryDirectory(prefix=f"tip-{sheet.slug}-") as tmp:
        media_dir = Path(tmp)
        raw = run_pandoc(source, media_dir)
        raw, images = replace_images(raw, media_dir, sheet.slug, sheet.title)
        body = clean_markdown(raw)
        body, had_support = remove_support_footer(body)
        body = normalize_list_image_artifacts(body)
        article = build_article(sheet, body, f"TipSheets/TipSheets/{sheet.source_name}", had_support)
        (DOCS_DIR / f"{sheet.slug}.md").write_text(article, encoding="utf-8", newline="\n")
    return images, {
        "source": f"TipSheets/TipSheets/{sheet.source_name}",
        "article": f"docs/{sheet.slug}.md",
        "status": sheet.status,
        "category": sheet.category,
        "title": sheet.title,
        "notes": sheet.note,
    }


def convert_pdf_only(sheet: TipSheet) -> tuple[list[str], dict[str, str]]:
    source = SOURCE_DIR / sheet.source_name
    text = subprocess.check_output(["pdftotext", "-layout", str(source), "-"], text=True, encoding="utf-8", errors="replace")
    text = clean_markdown(text)
    text = re.sub(r"\f", "\n\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    lines = [line.rstrip() for line in text.splitlines()]
    body = "\n".join(line for line in lines if line.strip())
    image_dir = IMAGE_ROOT / sheet.slug
    image_dir.mkdir(parents=True, exist_ok=True)
    for old in image_dir.glob("step-*.*"):
        old.unlink()
    with tempfile.TemporaryDirectory(prefix=f"pdf-{sheet.slug}-") as tmp:
        prefix = str(Path(tmp) / "page")
        subprocess.check_call(["pdftoppm", "-png", "-r", "144", str(source), prefix])
        rendered_pages = sorted(Path(tmp).glob("page-*.png"))
        images: list[str] = []
        image_tags: list[str] = []
        for index, page_image in enumerate(rendered_pages, start=1):
            dest = image_dir / f"step-{index:02d}.png"
            shutil.copy2(page_image, dest)
            rel = f"../image-upload-staging/{sheet.slug}/{dest.name}"
            manifest_path = f"image-upload-staging/{sheet.slug}/{dest.name}"
            images.append(manifest_path)
            image_tags.append(f'   <img class="guide-image" src="{rel}" alt="{sheet.title} source page {index}">')
    if not body:
        body = "This PDF-only source did not include extractable Word text. Review the rendered source pages below."
    body = body + "\n\n## Source Pages\n\n" + "\n\n".join(image_tags)
    article = build_article(sheet, body, f"TipSheets/TipSheets/{sheet.source_name}", True)
    (DOCS_DIR / f"{sheet.slug}.md").write_text(article, encoding="utf-8", newline="\n")
    return images, {
        "source": f"TipSheets/TipSheets/{sheet.source_name}",
        "article": f"docs/{sheet.slug}.md",
        "status": sheet.status,
        "category": sheet.category,
        "title": sheet.title,
        "notes": sheet.note,
    }


def write_manifest(new_rows: list[dict[str, str]]) -> None:
    existing: list[dict[str, str]] = []
    generated_sources = {row["source_doc"] for row in new_rows}
    if MANIFEST.exists():
        with MANIFEST.open(newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                if row["source_doc"] not in generated_sources:
                    existing.append(row)
    with MANIFEST.open("w", newline="", encoding="utf-8") as f:
        fieldnames = ["source_doc", "article", "local_image", "annotation_notes", "final_sharepoint_url"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(existing)
        writer.writerows(new_rows)


def write_inventory(converted: list[dict[str, str]]) -> None:
    rows: list[dict[str, str]] = []
    for source, slug in sorted(PILOT_SOURCES.items()):
        rows.append(
            {
                "source": f"TipSheets/TipSheets/{source}",
                "article": f"docs/{slug}.md",
                "status": "already_converted_pilot",
                "category": "Pilot",
                "title": "",
                "notes": "Reviewed pilot conversion.",
            }
        )
    rows.extend(sorted(converted, key=lambda r: (r["category"], r["title"])))
    rows.append(
        {
            "source": "TipSheets/TipSheets/01_Cornerstone Tip Sheet - TEMPLATE.docx",
            "article": "",
            "status": "template_skipped",
            "category": "Template",
            "title": "Cornerstone Tip Sheet Template",
            "notes": "Template source skipped.",
        }
    )
    with INVENTORY.open("w", newline="", encoding="utf-8") as f:
        fieldnames = ["source", "article", "status", "category", "title", "notes"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    DOCS_DIR.mkdir(exist_ok=True)
    IMAGE_ROOT.mkdir(parents=True, exist_ok=True)

    manifest_rows: list[dict[str, str]] = []
    inventory_rows: list[dict[str, str]] = []
    for sheet in TIP_SHEETS:
        images, inventory = convert_docx(sheet)
        inventory_rows.append(inventory)
        for image in images:
            manifest_rows.append(
                {
                    "source_doc": f"TipSheets/TipSheets/{sheet.source_name}",
                    "article": f"docs/{sheet.slug}.md",
                    "local_image": image,
                    "annotation_notes": "Extracted from source tip sheet; legacy screenshot callouts preserved for review.",
                    "final_sharepoint_url": "",
                }
            )
    pdf_images, pdf_inventory = convert_pdf_only(PDF_ONLY)
    inventory_rows.append(pdf_inventory)
    for image in pdf_images:
        manifest_rows.append(
            {
                "source_doc": f"TipSheets/TipSheets/{PDF_ONLY.source_name}",
                "article": f"docs/{PDF_ONLY.slug}.md",
                "local_image": image,
                "annotation_notes": "Rendered from PDF-only source page for review.",
                "final_sharepoint_url": "",
            }
        )
    write_manifest(manifest_rows)
    write_inventory(inventory_rows)
    print(f"converted={len(TIP_SHEETS) + 1} manifest_images={len(manifest_rows)} inventory={INVENTORY}")


if __name__ == "__main__":
    main()
