"""
INTELLIGENCE LAYER - Data Cleaning Pipeline
Transform raw events into cleaned, normalized data
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime
import re
from html import unescape

logger = logging.getLogger(__name__)


class EventCleaner:
    """Clean raw event data"""
    
    @staticmethod
    def clean_text(text: Optional[str]) -> Optional[str]:
        """Clean text: remove HTML, normalize whitespace"""
        if not text:
            return None
        
        # Remove HTML entities
        text = unescape(text)
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Normalize whitespace
        text = ' '.join(text.split())
        
        # Remove special characters
        text = text.strip()
        
        return text if text else None
    
    @staticmethod
    def clean_url(url: Optional[str]) -> Optional[str]:
        """Validate and clean URL"""
        if not url:
            return None
        
        url = url.strip()
        
        # Add https if missing
        if not url.startswith('http'):
            url = f"https://{url}"
        
        # Remove trailing slashes
        url = url.rstrip('/')
        
        return url if url.startswith('http') else None
    
    @staticmethod
    def extract_keywords(text: Optional[str]) -> list:
        """Extract keywords from text"""
        if not text:
            return []
        
        ai_keywords = [
            'artificial intelligence', 'machine learning', 'deep learning',
            'neural network', 'ai', 'ml', 'nlp', 'computer vision',
            'llm', 'generative', 'transformer', 'data science',
            'robotics', 'automation', 'algorithm', 'model training',
            'inference', 'embedding', 'neural', 'training',
            'classification', 'regression', 'clustering'
        ]
        
        text_lower = text.lower()
        found_keywords = [kw for kw in ai_keywords if kw in text_lower]
        return list(set(found_keywords))
    
    @classmethod
    def clean_event(cls, event: Dict[str, Any]) -> Dict[str, Any]:
        """Clean entire event"""
        return {
            'title': cls.clean_text(event.get('title')),
            'description': cls.clean_text(event.get('description')),
            'url': cls.clean_url(event.get('url')),
            'location_raw': cls.clean_text(event.get('location_raw')),
            'location_city': cls.clean_text(event.get('location_city')),
            'location_country': cls.clean_text(event.get('location_country')),
            'start_date': event.get('start_date'),
            'end_date': event.get('end_date'),
            'source': event.get('source'),
            'keywords': cls.extract_keywords(
                event.get('title') or '' + ' ' + event.get('description') or ''
            ),
            'is_online': event.get('is_online', False),
            'is_free': event.get('is_free'),
            'price': event.get('price'),
            'has_cfp': event.get('has_cfp', False),
            'submission_deadline': event.get('submission_deadline'),
        }


class DateNormalizer:
    """Normalize dates to ISO 8601"""
    
    MONTH_NAMES = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12,
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
    }
    
    @classmethod
    def normalize(cls, date_str: Optional[str]) -> Optional[str]:
        """Convert date to ISO 8601 format (YYYY-MM-DD)"""
        if not date_str or date_str in ['TBD', 'TBA', 'Unknown']:
            return None
        
        date_str = str(date_str).strip()
        
        try:
            # Already ISO format
            if re.match(r'^\d{4}-\d{2}-\d{2}', date_str):
                return date_str[:10]
            
            # US format: MM/DD/YYYY
            if re.match(r'^\d{1,2}/\d{1,2}/\d{4}', date_str):
                parts = date_str.split('/')
                return f"{parts[2]}-{parts[0]:0>2}-{parts[1]:0>2}"
            
            # EU format: DD.MM.YYYY
            if re.match(r'^\d{1,2}\.\d{1,2}\.\d{4}', date_str):
                parts = date_str.split('.')
                return f"{parts[2]}-{parts[1]:0>2}-{parts[0]:0>2}"
            
            # Text: Jan 15, 2025
            date_obj = datetime.strptime(date_str, '%b %d, %Y')
            return date_obj.strftime('%Y-%m-%d')
        
        except:
            logger.warning(f"Could not parse date: {date_str}")
            return None


class LocationNormalizer:
    """Normalize location data"""
    
    COUNTRY_MAP = {
        'usa': 'USA',
        'united states': 'USA',
        'uk': 'GBR',
        'united kingdom': 'GBR',
        'germany': 'DEU',
        'france': 'FRA',
        'japan': 'JPN',
        'china': 'CHN',
        'india': 'IND',
        'brazil': 'BRA',
        'canada': 'CAN',
        'australia': 'AUS',
        'mexico': 'MEX',
        'spain': 'ESP',
        'italy': 'ITA',
        'south korea': 'KOR',
        'singapore': 'SGP',
        'hong kong': 'HKG',
        'uae': 'ARE',
        'dubai': 'ARE',
        'qatar': 'QAT',
        'saudi arabia': 'SAU',
        'egypt': 'EGY',
        'south africa': 'ZAF',
        'online': 'ZZZ',
        'virtual': 'ZZZ',
    }
    
    REGION_MAP = {
        'usa': 'americas',
        'canada': 'americas',
        'mexico': 'americas',
        'brazil': 'americas',
        'uk': 'europe',
        'france': 'europe',
        'germany': 'europe',
        'spain': 'europe',
        'italy': 'europe',
        'japan': 'asia',
        'china': 'asia',
        'india': 'asia',
        'singapore': 'asia',
        'hong kong': 'asia',
        'uae': 'middle-east',
        'qatar': 'middle-east',
        'saudi arabia': 'middle-east',
        'egypt': 'africa',
        'south africa': 'africa',
        'online': 'worldwide',
        'virtual': 'worldwide',
    }
    
    @classmethod
    def normalize_country(cls, country: Optional[str]) -> Optional[str]:
        """Normalize country to ISO 3166-1 alpha-3"""
        if not country:
            return None
        
        country_lower = country.lower().strip()
        
        # Direct match
        if country_lower in cls.COUNTRY_MAP:
            return cls.COUNTRY_MAP[country_lower]
        
        # Substring match
        for key, code in cls.COUNTRY_MAP.items():
            if key in country_lower or country_lower in key:
                return code
        
        return None
    
    @classmethod
    def normalize_region(cls, country: Optional[str]) -> Optional[str]:
        """Map country to region"""
        if not country:
            return None
        
        country_lower = country.lower().strip()
        
        if country_lower in cls.REGION_MAP:
            return cls.REGION_MAP[country_lower]
        
        return 'worldwide'


class DataPipeline:
    """Complete data cleaning pipeline"""
    
    def __init__(self):
        self.cleaner = EventCleaner()
        self.date_normalizer = DateNormalizer()
        self.location_normalizer = LocationNormalizer()
    
    def process(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Process event through full pipeline"""
        
        # 1. Clean text fields
        cleaned = self.cleaner.clean_event(event)
        
        # 2. Normalize dates
        cleaned['start_date'] = self.date_normalizer.normalize(
            cleaned.get('start_date')
        )
        cleaned['end_date'] = self.date_normalizer.normalize(
            cleaned.get('end_date')
        )
        cleaned['submission_deadline'] = self.date_normalizer.normalize(
            cleaned.get('submission_deadline')
        )
        
        # 3. Normalize location
        country = cleaned.get('location_country')
        cleaned['location_country_iso'] = self.location_normalizer.normalize_country(country)
        cleaned['location_region'] = self.location_normalizer.normalize_region(country)
        
        # 4. Add processing metadata
        cleaned['processed_at'] = datetime.utcnow().isoformat()
        cleaned['data_quality_score'] = self._calculate_quality_score(cleaned)
        
        return cleaned
    
    def _calculate_quality_score(self, event: Dict[str, Any]) -> float:
        """Calculate data quality score (0-1)"""
        score = 0.0
        max_score = 0.0
        
        # Title (20%)
        if event.get('title') and len(event['title']) > 5:
            score += 0.2
        max_score += 0.2
        
        # URL (20%)
        if event.get('url'):
            score += 0.2
        max_score += 0.2
        
        # Date (20%)
        if event.get('start_date'):
            score += 0.2
        max_score += 0.2
        
        # Location (20%)
        if event.get('location_country_iso') and event.get('location_country_iso') != 'ZZZ':
            score += 0.2
        max_score += 0.2
        
        # Description (10%)
        if event.get('description') and len(event['description']) > 20:
            score += 0.1
        max_score += 0.1
        
        # Keywords (10%)
        if event.get('keywords') and len(event['keywords']) > 0:
            score += 0.1
        max_score += 0.1
        
        return score / max_score if max_score > 0 else 0.0


# Example usage
if __name__ == "__main__":
    pipeline = DataPipeline()
    
    raw_event = {
        'title': '<strong>AI Conference 2025</strong>',
        'description': 'Learn about machine learning and neural networks',
        'url': 'eventbrite.com/ai-conf-2025',
        'start_date': '01/15/2025',
        'location_country': 'USA',
        'is_online': False,
    }
    
    cleaned = pipeline.process(raw_event)
    print(cleaned)
