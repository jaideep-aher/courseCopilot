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
    embedding_model: str = "all-mpnet-base-v2"  # Higher-quality sentence transformer
    semantic_weight: float = 0.30  # Embedding similarity (high-quality model)
    keyword_weight: float = 0.15  # TF-IDF keyword similarity
    knowledge_points_weight: float = 0.15  # Structured keyword overlap
    description_overlap_weight: float = 0.15  # N-gram description overlap
    structural_weight: float = 0.25  # Category/level/prereq/credit matching

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
