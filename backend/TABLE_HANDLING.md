# Table Handling in PDF Processing

## Overview

The PDF processor has been enhanced to properly handle tables in medical guideline PDFs. Tables are crucial for diabetes treatment guidelines as they often contain:

- Medication dosages and schedules
- Treatment algorithms
- Comparison tables between medications
- Decision trees
- Reference ranges for lab values

## Implementation

### Primary Method: pdfplumber

The system uses **pdfplumber** as the primary PDF extraction library because it:

1. **Better Table Detection**: Automatically detects table structures in PDFs
2. **Preserves Structure**: Maintains row and column relationships
3. **Handles Complex Layouts**: Works with multi-column and merged cells

### Table Extraction Process

1. **Detection**: `pdfplumber` automatically detects tables on each page
2. **Conversion**: Tables are converted to a structured text format:
   ```
   [TABLE]
   Medication | Dosage | Frequency | Notes
   -------------------------------------------------
   Metformin | 500-2000mg | Twice daily | Start low
   [END TABLE]
   ```
3. **Preservation**: Tables are kept intact during chunking (not split across chunks)
4. **Metadata**: Chunks containing tables are marked with `contains_table: true`

### Fallback Method: pypdf

If `pdfplumber` fails (e.g., corrupted PDF, unsupported format), the system falls back to `pypdf` for basic text extraction. While this doesn't preserve table structure as well, it ensures the system continues to work.

## Table Format in RAG

Tables are formatted as markdown-like structures that are:

- **Readable by LLMs**: The pipe-separated format is easily understood by GPT models
- **Searchable**: Table content is included in vector embeddings
- **Contextual**: Tables are associated with their page numbers and surrounding text

## Example Output

For a medication dosage table, the extracted format looks like:

```
[PAGE 15]
According to ADA guidelines, first-line treatment options include:

[TABLE 1 on PAGE 15]
[TABLE]
Medication | Initial Dose | Max Dose | Frequency
--------------------------------------------------------
Metformin | 500mg | 2000mg | Twice daily with meals
Glipizide | 2.5mg | 20mg | Once daily before breakfast
Sitagliptin | 100mg | 100mg | Once daily
[END TABLE]

These medications should be titrated based on patient response.
```

## Benefits for RAG

1. **Better Retrieval**: When querying for specific dosages or medications, the structured table format improves semantic search
2. **Complete Information**: Tables are never split, ensuring complete medication information is retrieved
3. **Context Preservation**: Tables are linked to their page numbers and surrounding explanatory text

## Limitations

- **Complex Tables**: Very complex tables with many merged cells may not extract perfectly
- **Image-based Tables**: Tables that are images (not text) would require OCR (not currently implemented)
- **Large Tables**: Very large tables might exceed chunk size limits (though they're kept as single units)

## Future Improvements

Potential enhancements:

- OCR for image-based tables (using Tesseract or cloud OCR services)
- Better handling of merged cells
- Table type detection (dosage tables vs. comparison tables)
- Custom formatting for different table types
