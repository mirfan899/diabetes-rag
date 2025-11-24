"""
Script to initialize ChromaDB with PDF documents.
Run this script once to populate the vector database.

Usage:
    python init_db.py              # Add new documents to existing collection
    python init_db.py --reset      # Clear collection and reinitialize
    RESET_DB=true python init_db.py # Clear collection via environment variable
"""
import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from services.pdf_processor import PDFProcessor
from services.chroma_service import ChromaService

# Load environment variables
load_dotenv()


def main(reset: bool = False):
    """Initialize ChromaDB with PDF documents."""
    # Get PDF directory path (relative to project root)
    project_root = Path(__file__).parent.parent
    pdf_directory = project_root / "pdfs"
    
    if not pdf_directory.exists():
        print(f"PDF directory not found: {pdf_directory}")
        return
    
    print("=" * 50)
    print("Initializing ChromaDB with PDF documents")
    print("=" * 50)
    
    # Initialize services
    print("\n1. Initializing services...")
    pdf_processor = PDFProcessor(chunk_size=1000, chunk_overlap=200)
    chroma_service = ChromaService()
    
    # Check if collection already has data and handle reset
    existing_count = chroma_service.get_collection_count()
    if existing_count > 0:
        if reset:
            print(f"\nCollection has {existing_count} documents. Resetting...")
            chroma_service.delete_collection()
            chroma_service = ChromaService()  # Recreate collection
            print("Collection reset. Proceeding with initialization.")
        else:
            print(f"\nCollection already has {existing_count} documents.")
            print("Adding new documents to existing collection.")
            print("Use --reset flag to clear and reinitialize: python init_db.py --reset")
    
    # Process PDFs
    print("\n2. Processing PDF files...")
    chunks = pdf_processor.process_directory(str(pdf_directory))
    
    if not chunks:
        print("No chunks extracted from PDFs. Exiting.")
        return
    
    print(f"\nTotal chunks extracted: {len(chunks)}")
    
    # Add to ChromaDB
    print("\n3. Adding chunks to ChromaDB...")
    chroma_service.add_documents(chunks)
    
    # Verify
    final_count = chroma_service.get_collection_count()
    print(f"\n4. Verification: {final_count} documents in ChromaDB")
    
    print("\n" + "=" * 50)
    print("Initialization complete!")
    print("=" * 50)


if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Initialize ChromaDB with PDF documents")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Clear existing collection and reinitialize"
    )
    args = parser.parse_args()
    
    # Check environment variable for reset flag
    reset_flag = args.reset or os.getenv("RESET_DB", "").lower() in ("true", "1", "yes")
    
    main(reset=reset_flag)

