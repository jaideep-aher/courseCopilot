"""
Configuration settings for Course Co-Pilot
"""
import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application Settings
    app_name: str = "Course Co-Pilot"
    debug: bool = True

    # Data Settings
    default_csv_path: str = "data/syllabus_dataset.csv"

    # Matching Settings
    top_n_matches: int = 3
    similarity_threshold: float = 0.3  # Minimum similarity score (0-1)

    # ML Model Settings (for local matcher)
    embedding_model: str = "all-MiniLM-L6-v2"  # Sentence transformer model
    semantic_weight: float = 0.40  # 96% description coverage — most reliable
    keyword_weight: float = 0.20  # TF-IDF keyword similarity
    knowledge_points_weight: float = 0.20  # Useful when available, sparse for many unis
    structural_weight: float = 0.20  # Category/level matching

    # Default University Settings (can be overridden per request)
    source_university: str = "Houston"
    target_university: str = "Duke"

    # Pipeline Settings
    catalog_cache_ttl: int = 86400  # 24 hours in seconds
    max_target_subjects: int = 15

    # AI Research Agent Settings
    openai_api_key: str = ""
    vision_model: str = "gpt-4o"
    research_model: str = "gpt-4o-mini"
    max_concurrent_research: int = 2
    research_timeout_seconds: int = 30
    research_delay_seconds: float = 1.0  # Delay between research calls

    model_config = ConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",  # Ignore extra fields from .env (old LLM settings)
    )


settings = Settings()
