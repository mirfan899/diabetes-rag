#!/bin/bash
# Script to export Mermaid diagram to PNG
# Requires: npm install -g @mermaid-js/mermaid-cli

echo "Exporting flow diagram to PNG..."

# Check if mmdc is installed
if ! command -v mmdc &> /dev/null; then
    echo "mermaid-cli not found. Installing..."
    npm install -g @mermaid-js/mermaid-cli
fi

# Extract mermaid diagram and export
mmdc -i FLOW_DIAGRAM.md -o FLOW_DIAGRAM.png -b transparent -w 2400 -H 1800

if [ $? -eq 0 ]; then
    echo "✅ Diagram exported to FLOW_DIAGRAM.png"
else
    echo "❌ Export failed. You can also use online tools:"
    echo "   - https://mermaid.live/"
    echo "   - Copy the mermaid code from FLOW_DIAGRAM.md"
fi

