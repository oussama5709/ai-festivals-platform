"""
Logger Setup - Structured Logging
"""

import logging
import json
from datetime import datetime

class JsonFormatter(logging.Formatter):
    """Format logs as JSON"""

    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }

        if record.exc_info:
            log_obj['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_obj)

def setup_logging(level=logging.INFO):
    """Setup structured logging"""
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Console handler
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root_logger.addHandler(handler)

    return root_logger
