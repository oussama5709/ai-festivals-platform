"""
Crawler Configuration
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Crawler settings
CRAWLER_TIMEOUT_MS = int(os.getenv("CRAWLER_TIMEOUT_MS", "30000"))
MAX_WORKERS = int(os.getenv("MAX_WORKERS", "5"))
HEADLESS_MODE = os.getenv("HEADLESS_MODE", "true").lower() == "true"
USE_PROXY = os.getenv("USE_PROXY", "false").lower() == "true"

# Proxy settings
PROXY_LIST = os.getenv("PROXY_LIST", "").split(",") if os.getenv("PROXY_LIST") else []

# Rate limiting
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "json"  # or "text"
