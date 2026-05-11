# AI Events Research Infrastructure

Production-grade platform for aggregating, analyzing, and publishing AI-related events worldwide.

## 📋 Overview

This is a **3-layer research infrastructure** for building a comprehensive, public dataset of AI events:

1. **Data Collection Layer** - Multi-source crawler with anti-detection
2. **Research Intelligence Layer** - Data cleaning, deduplication, and AI relevance scoring
3. **Community Hub Layer** - Public API and web interface for the research community

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- PostgreSQL 13+
- Docker & Docker Compose (optional)
- Node.js 18+ (for frontend)

### Installation

```bash
git clone https://github.com/yourusername/ai-events-research.git
cd ai-events-research

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
createdb ai_events_research
psql ai_events_research < database/schema.sql

# Copy environment file
copy .env.example .env
```
