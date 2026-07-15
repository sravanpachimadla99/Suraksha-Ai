import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
import uuid

def generate_evidence_pdf(report_data: dict, output_dir: str = "backend/uploads") -> str:
    """Generates a professional PDF evidence package."""
    os.makedirs(output_dir, exist_ok=True)
    filename = f"evidence_package_{report_data.get('id', uuid.uuid4())}.pdf"
    filepath = os.path.join(output_dir, filename)
    
    doc = SimpleDocTemplate(filepath, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Header
    story.append(Paragraph("CyberShield AI - Official Evidence Report", styles['Title']))
    story.append(Spacer(1, 12))
    
    # Metadata
    meta_data = [
        ["Report ID:", report_data.get("id", "N/A")],
        ["Fraud Type:", report_data.get("fraud_type", "Unknown")],
        ["Risk Level:", report_data.get("risk_level", "Unknown")],
        ["Generated At:", report_data.get("created_at", "N/A")]
    ]
    
    t = Table(meta_data)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.lightgrey),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.black),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))
    story.append(t)
    story.append(Spacer(1, 20))
    
    # Summary
    story.append(Paragraph("Executive Summary", styles['Heading2']))
    story.append(Paragraph(report_data.get("summary", "No summary provided."), styles['BodyText']))
    story.append(Spacer(1, 12))
    
    # FIR Draft
    story.append(Paragraph("Suggested Legal Sections (FIR Draft)", styles['Heading2']))
    sections = report_data.get("suggested_sections", [])
    if sections:
        for s in sections:
            story.append(Paragraph(f"- {s}", styles['BodyText']))
    else:
        story.append(Paragraph("None identified.", styles['BodyText']))
        
    doc.build(story)
    
    return filepath
