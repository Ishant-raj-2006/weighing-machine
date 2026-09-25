import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

INK = colors.HexColor("#14213D")
STEEL = colors.HexColor("#4A5568")
BRASS = colors.HexColor("#B7862C")
PASS_GREEN = colors.HexColor("#1F7A4D")
FAIL_RED = colors.HexColor("#B23A34")
LINE = colors.HexColor("#D8DCE2")


def _styles():
    ss = getSampleStyleSheet()
    ss.add(ParagraphStyle(name="ReportTitle", fontName="Helvetica-Bold", fontSize=15,
                           textColor=INK, alignment=TA_CENTER, spaceAfter=2))
    ss.add(ParagraphStyle(name="ReportSubtitle", fontName="Helvetica", fontSize=9.5,
                           textColor=STEEL, alignment=TA_CENTER, spaceAfter=10))
    ss.add(ParagraphStyle(name="SectionHeading", fontName="Helvetica-Bold", fontSize=11,
                           textColor=INK, spaceBefore=14, spaceAfter=6))
    ss.add(ParagraphStyle(name="Small", fontName="Helvetica", fontSize=8.5, textColor=STEEL))
    ss.add(ParagraphStyle(name="CellText", fontName="Helvetica", fontSize=8.5, textColor=INK))
    return ss


def _kv_table(pairs, col_widths=(45 * mm, 45 * mm, 45 * mm, 45 * mm)):
    """Render a list of (label, value) pairs, two per row, as a table."""
    rows = []
    for i in range(0, len(pairs), 2):
        left = pairs[i]
        right = pairs[i + 1] if i + 1 < len(pairs) else ("", "")
        rows.append([left[0], left[1], right[0], right[1]])
    t = Table(rows, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), STEEL),
        ("TEXTCOLOR", (2, 0), (2, -1), STEEL),
        ("TEXTCOLOR", (1, 0), (1, -1), INK),
        ("TEXTCOLOR", (3, 0), (3, -1), INK),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
    ]))
    return t


def _result_style_for(result_col_index, data, header_rows=1):
    cmds = []
    for r in range(header_rows, len(data)):
        val = data[r][result_col_index]
        color = PASS_GREEN if val == "PASS" else (FAIL_RED if val == "FAIL" else STEEL)
        cmds.append(("TEXTCOLOR", (result_col_index, r), (result_col_index, r), color))
        cmds.append(("FONTNAME", (result_col_index, r), (result_col_index, r), "Helvetica-Bold"))
    return cmds


def _data_table(headers, rows, result_col_index=None, col_widths=None):
    data = [headers] + rows
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F6F4")]),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if result_col_index is not None:
        style += _result_style_for(result_col_index, data)
    t.setStyle(TableStyle(style))
    return t


def build_pdf(context: dict) -> bytes:
    """
    context keys: report, instrument, weighing, repeatability, eccentricity,
    tested_by_name, reviewed_by_name
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=16 * mm, bottomMargin=16 * mm, leftMargin=16 * mm, rightMargin=16 * mm,
        title=f"NAWI Test Report {context['report']['report_number']}",
    )
    ss = _styles()
    story = []

    report = context["report"]
    instrument = context["instrument"]

    story.append(Paragraph("TEST REPORT FOR NON-AUTOMATIC WEIGHING INSTRUMENT (NAWI)", ss["ReportTitle"]))
    story.append(Paragraph("Issued in accordance with OIML Recommendation R 76-1 &nbsp;|&nbsp; Legal Metrology Act, 2009", ss["ReportSubtitle"]))
    story.append(HRFlowable(width="100%", thickness=1.2, color=BRASS, spaceAfter=10))

    story.append(Paragraph("1. Report &amp; Laboratory Details", ss["SectionHeading"]))
    story.append(_kv_table([
        ("Report No.", report["report_number"]),
        ("Test Date", str(report["test_date"])),
        ("Laboratory", report["lab_name"]),
        ("Test Stage", report["test_stage"].replace("_", " ").title()),
        ("Ambient Temperature", f'{report.get("lab_temperature_c", "-")} °C'),
        ("Relative Humidity", f'{report.get("lab_humidity_pct", "-")} %'),
        ("Atmospheric Pressure", f'{report.get("atmospheric_pressure_hpa", "-")} hPa'),
        ("Status", report["status"].replace("_", " ").title()),
    ]))

    story.append(Paragraph("2. Instrument Under Test", ss["SectionHeading"]))
    story.append(_kv_table([
        ("Manufacturer", instrument["manufacturer_name"]),
        ("Model", instrument["model_name"]),
        ("Serial No.", instrument["serial_number"]),
        ("Instrument Type", instrument["instrument_type"]),
        ("Max Capacity (Max)", f'{instrument["max_capacity"]} {instrument["unit"]}'),
        ("Min Capacity (Min)", f'{instrument["min_capacity"]} {instrument["unit"]}'),
        ("Verification Scale Interval (e)", f'{instrument["e_value"]} {instrument["unit"]}'),
        ("Accuracy Class", f'Class {instrument["accuracy_class"]}'),
    ]))

    weighing = context.get("weighing", [])
    if weighing:
        story.append(Paragraph("3. Accuracy (Weighing) Test", ss["SectionHeading"]))
        unit = instrument["unit"]
        rows = [[
            str(i + 1), f'{w["test_load"]} {unit}', f'{w["indicated_value"]} {unit}',
            f'{w["error"]:+.3f} {unit}', f'± {w["mpe"]:.3f} {unit}', f'{w["verification_intervals"]}',
            w["result"],
        ] for i, w in enumerate(weighing)]
        story.append(_data_table(
            ["#", "Test Load", "Indication", "Error", "MPE", "m = load/e", "Result"],
            rows, result_col_index=6,
        ))

    repeatability = context.get("repeatability", [])
    if repeatability:
        story.append(Paragraph("4. Repeatability Test", ss["SectionHeading"]))
        unit = instrument["unit"]
        rows = [[
            f'{rt["test_load"]} {unit}',
            ", ".join(f'{v:g}' for v in rt["readings"]),
            f'{rt["mean_value"]:.3f} {unit}', f'{rt["range_value"]:.3f} {unit}',
            f'± {rt["mpe"]:.3f} {unit}', rt["result"],
        ] for rt in repeatability]
        story.append(_data_table(
            ["Test Load", "Readings", "Mean", "Range", "MPE", "Result"],
            rows, result_col_index=5,
        ))

    eccentricity = context.get("eccentricity", [])
    if eccentricity:
        story.append(Paragraph("5. Eccentricity (Corner Load) Test", ss["SectionHeading"]))
        unit = instrument["unit"]
        rows = [[
            e["position"], f'{e["test_load"]} {unit}', f'{e["indicated_value"]} {unit}',
            f'{e["error"]:+.3f} {unit}', f'± {e["mpe"]:.3f} {unit}', e["result"],
        ] for e in eccentricity]
        story.append(_data_table(
            ["Position", "Test Load", "Indication", "Error", "MPE", "Result"],
            rows, result_col_index=5,
        ))

    story.append(Spacer(1, 14))
    overall = report.get("overall_result") or "PENDING"
    color = PASS_GREEN if overall == "PASS" else (FAIL_RED if overall == "FAIL" else STEEL)
    banner = Table([[f"OVERALL RESULT:  {overall}"]], colWidths=[180 * mm])
    banner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 12),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(banner)

    if report.get("remarks"):
        story.append(Paragraph("Remarks", ss["SectionHeading"]))
        story.append(Paragraph(report["remarks"], ss["CellText"]))

    story.append(Spacer(1, 24))
    sign_table = Table([
        ["Tested By", "Reviewed By"],
        [context.get("tested_by_name") or "-", context.get("reviewed_by_name") or "-"],
        ["Signature: ______________________", "Signature: ______________________"],
    ], colWidths=[90 * mm, 90 * mm])
    sign_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 0), (-1, 0), STEEL),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEABOVE", (0, 2), (-1, 2), 0.4, LINE),
    ]))
    story.append(sign_table)

    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LINE, spaceAfter=4))
    story.append(Paragraph(
        "This report was generated by the NAWI Test Report system. Prototype scope — verify MPE "
        "values against the current official OIML R76-1 text before use beyond demonstration.",
        ss["Small"],
    ))

    doc.build(story)
    return buf.getvalue()
