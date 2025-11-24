#!/bin/bash
# Setup script for the Diabetes RAG Backend

echo "=========================================="
echo "Diabetes RAG Backend Setup"
echo "=========================================="

# Check if pyenv is installed
if ! command -v pyenv &> /dev/null; then
    echo "Error: pyenv is not installed"
    echo "Please install pyenv first:"
    echo "  curl https://pyenv.run | bash"
    echo "  Or visit: https://github.com/pyenv/pyenv#installation"
    exit 1
fi

# Set Python version to 3.10.10
PYTHON_VERSION="3.10.10"

echo "Setting up Python ${PYTHON_VERSION} with pyenv..."

# Check if Python 3.10.10 is installed
if ! pyenv versions --bare | grep -q "^${PYTHON_VERSION}$"; then
    echo "Python ${PYTHON_VERSION} not found. Installing..."
    pyenv install ${PYTHON_VERSION}
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install Python ${PYTHON_VERSION}"
        exit 1
    fi
else
    echo "Python ${PYTHON_VERSION} is already installed"
fi

# Set local Python version for this directory
echo "Setting local Python version to ${PYTHON_VERSION}..."
pyenv local ${PYTHON_VERSION}

# Verify Python version
PYTHON_CMD=$(pyenv which python)
echo "Using Python: ${PYTHON_CMD}"
echo "Python version: $(${PYTHON_CMD} --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment with Python ${PYTHON_VERSION}..."
    ${PYTHON_CMD} -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check for .env file
if [ ! -f ".env" ]; then
    echo ""
    echo "=========================================="
    echo "WARNING: .env file not found!"
    echo "=========================================="
    echo "Please create a .env file with your OPENAI_API_KEY:"
    echo "  OPENAI_API_KEY=your_key_here"
    echo ""
    echo "You can copy .env.example to .env and edit it:"
    echo "  cp .env.example .env"
    echo ""
else
    echo ".env file found"
fi

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Make sure your .env file has OPENAI_API_KEY set"
echo "2. Run 'python init_db.py' to initialize ChromaDB with PDFs"
echo "3. Run 'python main.py' to start the server"
echo ""

