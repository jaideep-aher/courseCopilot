"""
LLM Client abstraction for Course Co-Pilot
Supports both Anthropic (Claude) and OpenAI (GPT) models
"""
import os
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import json

from core.config import settings


class LLMClient(ABC):
    """Abstract base class for LLM clients"""
    
    @abstractmethod
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate a response from the LLM"""
        pass
    
    @abstractmethod
    async def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict:
        """Generate a JSON response from the LLM"""
        pass


class AnthropicClient(LLMClient):
    """Anthropic Claude client"""
    
    def __init__(self, api_key: Optional[str] = None):
        try:
            from anthropic import AsyncAnthropic
            self.client = AsyncAnthropic(
                api_key=api_key or settings.anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
            )
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Anthropic client: {e}")
        
        self.model = settings.llm_model
        self.temperature = settings.llm_temperature
        self.max_tokens = settings.llm_max_tokens
    
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate a response using Claude"""
        messages = [{"role": "user", "content": prompt}]
        
        kwargs = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "messages": messages,
        }
        
        if system_prompt:
            kwargs["system"] = system_prompt
        
        response = await self.client.messages.create(**kwargs)
        return response.content[0].text
    
    async def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict:
        """Generate a JSON response using Claude"""
        json_system = (system_prompt or "") + "\n\nRespond ONLY with valid JSON. No markdown, no explanation."
        
        response = await self.generate(prompt, json_system)
        
        # Clean up response - remove any markdown code blocks
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        
        return json.loads(response.strip())


class OpenAIClient(LLMClient):
    """OpenAI GPT client"""
    
    def __init__(self, api_key: Optional[str] = None):
        try:
            from openai import AsyncOpenAI
            self.client = AsyncOpenAI(
                api_key=api_key or settings.openai_api_key or os.getenv("OPENAI_API_KEY")
            )
        except Exception as e:
            raise RuntimeError(f"Failed to initialize OpenAI client: {e}")
        
        self.model = "gpt-4-turbo-preview"
        self.temperature = settings.llm_temperature
        self.max_tokens = settings.llm_max_tokens
    
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate a response using GPT"""
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )
        
        return response.choices[0].message.content
    
    async def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict:
        """Generate a JSON response using GPT"""
        messages = []
        
        json_system = (system_prompt or "") + "\n\nRespond ONLY with valid JSON. No markdown, no explanation."
        messages.append({"role": "system", "content": json_system})
        messages.append({"role": "user", "content": prompt})
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            response_format={"type": "json_object"},
        )
        
        return json.loads(response.choices[0].message.content)


class MockLLMClient(LLMClient):
    """Mock client for testing without API calls"""
    
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        return "This is a mock response for testing purposes."
    
    async def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict:
        return {
            "summary": "Mock summary",
            "topics": ["topic1", "topic2"],
            "similarity_score": 0.75
        }


def get_llm_client(provider: Optional[str] = None) -> LLMClient:
    """Factory function to get the appropriate LLM client"""
    provider = provider or settings.llm_provider
    
    if provider == "anthropic":
        return AnthropicClient()
    elif provider == "openai":
        return OpenAIClient()
    elif provider == "mock":
        return MockLLMClient()
    else:
        raise ValueError(f"Unknown LLM provider: {provider}")
