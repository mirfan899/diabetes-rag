import os
from typing import List, Dict
from pypdf import PdfReader
import pdfplumber
import re


class PDFProcessor:
    """Process PDF files and extract text chunks for RAG with enhanced table handling."""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def extract_table_as_text(self, table) -> str:
        """Convert a table to a readable text format."""
        if not table:
            return ""
        
        # Convert table to markdown-like format
        rows = []
        for row in table:
            # Filter out None values and convert to strings
            clean_row = [str(cell) if cell is not None else "" for cell in row]
            rows.append(clean_row)
        
        if not rows:
            return ""
        
        # Format as a structured text table
        table_text = "\n[TABLE]\n"
        for i, row in enumerate(rows):
            if i == 0:
                # Header row
                table_text += " | ".join(row) + "\n"
                table_text += "-" * (sum(len(cell) for cell in row) + len(row) * 3) + "\n"
            else:
                table_text += " | ".join(row) + "\n"
        table_text += "[END TABLE]\n"
        
        return table_text
    
    def extract_text_with_tables(self, pdf_path: str) -> str:
        """Extract text and tables from PDF using pdfplumber for better table handling."""
        full_text = ""
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    # Extract regular text
                    page_text = page.extract_text()
                    if page_text:
                        full_text += f"\n[PAGE {page_num}]\n{page_text}\n"
                    
                    # Extract tables from the page
                    tables = page.extract_tables()
                    if tables:
                        for table_idx, table in enumerate(tables):
                            table_text = self.extract_table_as_text(table)
                            if table_text:
                                full_text += f"\n[TABLE {table_idx + 1} on PAGE {page_num}]\n{table_text}\n"
            
            return full_text
            
        except Exception as e:
            print(f"Error with pdfplumber for {pdf_path}: {e}, falling back to pypdf")
            # Fallback to pypdf if pdfplumber fails
            return self.extract_text_from_pdf_fallback(pdf_path)
    
    def extract_text_from_pdf_fallback(self, pdf_path: str) -> str:
        """Fallback method using pypdf for basic text extraction."""
        try:
            reader = PdfReader(pdf_path)
            text = ""
            for page_num, page in enumerate(reader.pages, 1):
                page_text = page.extract_text()
                if page_text:
                    text += f"\n[PAGE {page_num}]\n{page_text}\n"
            return text
        except Exception as e:
            print(f"Error extracting text from {pdf_path}: {e}")
            return ""
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract all text from a PDF file (main entry point)."""
        # Use pdfplumber for better table handling
        return self.extract_text_with_tables(pdf_path)
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize extracted text while preserving table structure."""
        # Preserve table markers and structure
        # First, protect table sections
        table_sections = []
        table_pattern = r'\[TABLE.*?\[END TABLE\]'
        
        for match in re.finditer(table_pattern, text, re.DOTALL):
            table_sections.append(match.group(0))
        
        # Replace table sections with placeholders
        protected_text = text
        for i, table in enumerate(table_sections):
            protected_text = protected_text.replace(table, f"__TABLE_{i}__", 1)
        
        # Clean the non-table text
        # Remove excessive whitespace but preserve line breaks in tables
        protected_text = re.sub(r'[ \t]+', ' ', protected_text)
        protected_text = re.sub(r'\n\s*\n\s*\n+', '\n\n', protected_text)
        
        # Restore table sections
        cleaned_text = protected_text
        for i, table in enumerate(table_sections):
            cleaned_text = cleaned_text.replace(f"__TABLE_{i}__", table, 1)
        
        return cleaned_text.strip()
    
    def split_into_chunks(self, text: str, metadata: Dict = None) -> List[Dict]:
        """Split text into overlapping chunks while preserving table integrity."""
        chunks = []
        
        if not text:
            return chunks
        
        # First, identify and protect table sections
        table_pattern = r'\[TABLE.*?\[END TABLE\]'
        table_sections = []
        for match in re.finditer(table_pattern, text, re.DOTALL):
            table_sections.append((match.start(), match.end(), match.group(0)))
        
        # Split text by tables, keeping tables intact
        parts = []
        last_end = 0
        
        for start, end, table_content in table_sections:
            # Add text before table
            if start > last_end:
                parts.append(('text', text[last_end:start]))
            # Add table as a single unit
            parts.append(('table', table_content))
            last_end = end
        
        # Add remaining text after last table
        if last_end < len(text):
            parts.append(('text', text[last_end:]))
        
        # If no tables found, treat entire text as regular text
        if not parts:
            parts = [('text', text)]
        
        # Now chunk each part
        for part_type, part_text in parts:
            if part_type == 'table':
                # Tables are kept as single chunks (they're usually not too large)
                chunk_data = {
                    "text": part_text.strip(),
                    "metadata": {**(metadata or {}), "contains_table": True}
                }
                chunks.append(chunk_data)
            else:
                # Regular text chunking
                words = part_text.split()
                if not words:
                    continue
                
                current_chunk = []
                current_length = 0
                
                for word in words:
                    word_length = len(word) + 1  # +1 for space
                    
                    if current_length + word_length > self.chunk_size and current_chunk:
                        # Save current chunk
                        chunk_text = " ".join(current_chunk)
                        chunk_data = {
                            "text": self.clean_text(chunk_text),
                            "metadata": {**(metadata or {}), "contains_table": False}
                        }
                        chunks.append(chunk_data)
                        
                        # Start new chunk with overlap
                        overlap_size = min(self.chunk_overlap // 10, len(current_chunk))
                        overlap_words = current_chunk[-overlap_size:] if overlap_size > 0 else current_chunk
                        current_chunk = overlap_words + [word]
                        current_length = sum(len(w) + 1 for w in current_chunk)
                    else:
                        current_chunk.append(word)
                        current_length += word_length
                
                # Add the last chunk of this part
                if current_chunk:
                    chunk_text = " ".join(current_chunk)
                    chunk_data = {
                        "text": self.clean_text(chunk_text),
                        "metadata": {**(metadata or {}), "contains_table": False}
                    }
                    chunks.append(chunk_data)
        
        return chunks
    
    def process_pdf(self, pdf_path: str) -> List[Dict]:
        """Process a PDF file and return chunks with metadata."""
        filename = os.path.basename(pdf_path)
        text = self.extract_text_from_pdf(pdf_path)
        
        if not text:
            return []
        
        metadata = {
            "source": filename,
            "file_path": pdf_path
        }
        
        chunks = self.split_into_chunks(text, metadata)
        
        # Add chunk index to metadata
        for i, chunk in enumerate(chunks):
            chunk["metadata"]["chunk_index"] = i
        
        return chunks
    
    def process_directory(self, directory_path: str) -> List[Dict]:
        """Process all PDF files in a directory."""
        all_chunks = []
        
        if not os.path.exists(directory_path):
            print(f"Directory not found: {directory_path}")
            return all_chunks
        
        pdf_files = [f for f in os.listdir(directory_path) if f.lower().endswith('.pdf')]
        
        for pdf_file in pdf_files:
            pdf_path = os.path.join(directory_path, pdf_file)
            print(f"Processing {pdf_file}...")
            chunks = self.process_pdf(pdf_path)
            all_chunks.extend(chunks)
            print(f"Extracted {len(chunks)} chunks from {pdf_file}")
        
        return all_chunks

