#!/bin/bash
# Structural AI API - Setup Script
# Automates environment setup for Linux

set -e

echo "=============================================="
echo "  Structural AI API - Setup Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python version
echo -e "${YELLOW}Checking Python version...${NC}"
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "  Python $python_version detected"

# Create virtual environment
echo -e "\n${YELLOW}Creating virtual environment...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}  ✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}  ✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo -e "\n${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Upgrade pip
echo -e "\n${YELLOW}Upgrading pip...${NC}"
pip install --upgrade pip

# Install Python dependencies
echo -e "\n${YELLOW}Installing Python dependencies...${NC}"
pip install -r requirements.txt
echo -e "${GREEN}  ✓ Dependencies installed${NC}"

# Download spaCy model
echo -e "\n${YELLOW}Downloading spaCy model...${NC}"
python -m spacy download en_core_web_lg
echo -e "${GREEN}  ✓ spaCy model downloaded${NC}"

# Setup environment file
echo -e "\n${YELLOW}Setting up environment file...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}  ✓ .env file created${NC}"
else
    echo -e "${GREEN}  ✓ .env file already exists${NC}"
fi

# Create directories
echo -e "\n${YELLOW}Creating necessary directories...${NC}"
mkdir -p models nltk_data logs
echo -e "${GREEN}  ✓ Directories created${NC}"

# Check CUDA availability
echo -e "\n${YELLOW}Checking CUDA availability...${NC}"
if command -v nvidia-smi &> /dev/null; then
    gpu_info=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits 2>/dev/null || echo "")
    if [ -n "$gpu_info" ]; then
        echo -e "${GREEN}  ✓ NVIDIA GPU detected:${NC}"
        echo "    $gpu_info"
        echo -e "  ${YELLOW}GPU acceleration will be available${NC}"
    else
        echo -e "${YELLOW}  ⚠ NVIDIA driver detected but no GPU found${NC}"
        echo -e "  ${YELLOW}Falling back to CPU mode${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠ No NVIDIA driver detected${NC}"
    echo -e "  ${YELLOW}Will run in CPU-only mode${NC}"
fi

# Test installation
echo -e "\n${YELLOW}Testing installation...${NC}"
python -c "import torch; import spacy; import nltk; print('  ✓ Core libraries imported successfully')"

echo -e "\n${GREEN}=============================================="
echo "  Setup Complete!"
echo "==============================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Activate environment: source venv/bin/activate"
echo "  2. Test the pipeline: python -m engine.pipeline \"Hello world\""
echo "  3. Edit .env to customize settings"
echo ""
echo -e "${YELLOW}For Docker deployment:${NC}"
echo "  docker-compose up structural-ai"
echo ""
