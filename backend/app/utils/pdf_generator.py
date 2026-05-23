import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_quotation_pdf(quotation):
    """Generates a professional B2B PDF invoice file using ReportLab platypus."""
    buffer = io.BytesIO()
    
    # 0.5 inch margins for enterprise alignment
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=36, 
        leftMargin=36, 
        topMargin=36, 
        bottomMargin=36
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom Brand Colors
    navy = colors.HexColor("#1e1b4b")  # Dark Indigo
    emerald = colors.HexColor("#0f766e")  # Teal Accent
    slate_dark = colors.HexColor("#334155")
    slate_light = colors.HexColor("#f8fafc")
    
    # Custom text styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=navy
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=emerald
    )
    
    h2_style = ParagraphStyle(
        'SecHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=navy,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=slate_dark
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    # --- HEADER SECTION ---
    header_data = [
        [
            Paragraph("SMARTKITCHEN HUB", title_style),
            Paragraph("<b>QUOTATION</b>", ParagraphStyle('RightTitle', parent=title_style, alignment=2, fontSize=20, textColor=emerald))
        ],
        [
            Paragraph("Enterprise Commercial Kitchen Solutions", subtitle_style),
            Paragraph(f"<b>Number:</b> {quotation.quotation_number}", ParagraphStyle('RightSub', parent=body_style, alignment=2))
        ]
    ]
    header_table = Table(header_data, colWidths=[300, 240])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))
    
    # Draw horizontal line separating headers
    line_table = Table([[""]], colWidths=[540])
    line_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 1.5, navy),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 15))
    
    # --- METADATA SECTION ---
    meta_data = [
        [
            Paragraph("<b>Vendor Details</b>", h2_style),
            Paragraph("<b>Quotation Details</b>", h2_style)
        ],
        [
            Paragraph(
                "SmartKitchen Hub Solutions Ltd.<br/>"
                "100 Industrial Parkway, Suite A<br/>"
                "Mumbai, MH 400051<br/>"
                "Email: billing@smartkitchen.com", 
                body_style
            ),
            Paragraph(
                f"<b>Date Generated:</b> {quotation.created_at.strftime('%Y-%m-%d')}<br/>"
                f"<b>Valid Until:</b> {quotation.valid_until.strftime('%Y-%m-%d')}<br/>"
                f"<b>Status:</b> {quotation.status}<br/>"
                f"<b>Account Exec:</b> {quotation.creator.first_name} {quotation.creator.last_name}", 
                body_style
            )
        ]
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))
    
    # --- CUSTOMER DETAILS ---
    customer_data = [
        [Paragraph("<b>Prepared For</b>", h2_style)],
        [
            Paragraph(
                f"<b>{quotation.customer.company_name}</b><br/>"
                f"Attn: {quotation.customer.contact_person}<br/>"
                f"Phone: {quotation.customer.phone}<br/>"
                f"Address: {quotation.customer.address}",
                body_style
            )
        ]
    ]
    customer_table = Table(customer_data, colWidths=[540])
    customer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), slate_light),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(customer_table)
    story.append(Spacer(1, 20))
    
    # --- ITEMS TABLE ---
    table_style = TableStyle([
        ('BACKGROUND', (0,0), (-1,0), navy),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('BOTTOMPADDING', (0,1), (-1,-1), 4),
        ('TOPPADDING', (0,1), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, slate_light])
    ])
    
    items_header = [
        Paragraph("<b>Equipment / Item</b>", ParagraphStyle('ItemCol', parent=body_style, textColor=colors.white)),
        Paragraph("<b>SKU</b>", ParagraphStyle('SkuCol', parent=body_style, textColor=colors.white)),
        Paragraph("<b>Qty</b>", ParagraphStyle('QtyCol', parent=body_style, textColor=colors.white, alignment=2)),
        Paragraph("<b>Unit Price</b>", ParagraphStyle('PriceCol', parent=body_style, textColor=colors.white, alignment=2)),
        Paragraph("<b>Total</b>", ParagraphStyle('TotalCol', parent=body_style, textColor=colors.white, alignment=2))
    ]
    
    items_data = [items_header]
    
    for item in quotation.items:
        items_data.append([
            Paragraph(item.product.name, body_style),
            Paragraph(item.product.sku, body_style),
            Paragraph(str(item.quantity), ParagraphStyle('CenterText', parent=body_style, alignment=2)),
            Paragraph(f"${item.unit_price:,.2f}", ParagraphStyle('RightText', parent=body_style, alignment=2)),
            Paragraph(f"${item.total_price:,.2f}", ParagraphStyle('RightText', parent=body_style, alignment=2))
        ])
        
    items_table = Table(items_data, colWidths=[200, 90, 45, 100, 105])
    items_table.setStyle(table_style)
    story.append(items_table)
    story.append(Spacer(1, 15))
    
    # --- SUMMARY BLOCK ---
    summary_data = [
        [Paragraph("<b>Subtotal:</b>", body_style), Paragraph(f"${quotation.subtotal:,.2f}", ParagraphStyle('SubR', parent=body_style, alignment=2))],
        [Paragraph("<b>Tax / VAT:</b>", body_style), Paragraph(f"+${quotation.tax:,.2f}", ParagraphStyle('TaxR', parent=body_style, alignment=2))],
        [Paragraph("<b>Discounts:</b>", body_style), Paragraph(f"-${quotation.discount:,.2f}", ParagraphStyle('DiscR', parent=body_style, alignment=2))],
        [Paragraph("<b>Grand Total:</b>", body_bold), Paragraph(f"${quotation.total:,.2f}", ParagraphStyle('TotR', parent=body_bold, alignment=2))]
    ]
    summary_table = Table(summary_data, colWidths=[110, 100])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BACKGROUND', (0,3), (-1,3), slate_light),
        ('LINEABOVE', (0,3), (-1,3), 1, navy),
    ]))
    
    # We place the notes on the left and the pricing totals on the right
    notes_paragraph = Paragraph(
        f"<b>Notes & Terms:</b><br/>{quotation.notes or 'Standard payment within 30 days. Commercial warranty applies from date of installation.'}", 
        body_style
    )
    
    final_layout_data = [
        [notes_paragraph, summary_table]
    ]
    final_layout = Table(final_layout_data, colWidths=[310, 230])
    final_layout.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    
    story.append(final_layout)
    
    # Build Document
    doc.build(story)
    
    buffer.seek(0)
    return buffer
