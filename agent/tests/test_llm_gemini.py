"""Tests for the Gemini provider (HTTP API)."""
from __future__ import annotations

import base64
import json
import pytest
from unittest.mock import AsyncMock, patch

import httpx

from flowboard.services.llm.base import LLMError
from flowboard.services.llm.gemini import GeminiProvider
from flowboard.services.llm import secrets

class _FakeResponse:
    def __init__(self, status_code=200, json_data=None, text=""):
        self.status_code = status_code
        self._json_data = json_data or {}
        self.text = text

    def json(self):
        return self._json_data

    def raise_for_status(self):
        if self.status_code >= 400:
            request = httpx.Request("POST", "http://fake")
            raise httpx.HTTPStatusError("Error", request=request, response=self)

@pytest.mark.asyncio
async def test_is_available_true_when_key_set(monkeypatch):
    monkeypatch.setattr(secrets, "get_api_key", lambda x: "fake-key")
    p = GeminiProvider()
    assert await p.is_available() is True

@pytest.mark.asyncio
async def test_is_available_false_when_key_missing(monkeypatch):
    monkeypatch.setattr(secrets, "get_api_key", lambda x: None)
    p = GeminiProvider()
    assert await p.is_available() is False

@pytest.mark.asyncio
async def test_run_success(monkeypatch):
    monkeypatch.setattr(secrets, "get_api_key", lambda x: "fake-key")
    p = GeminiProvider()
    
    mock_post = AsyncMock(return_value=_FakeResponse(json_data={
        "candidates": [{"content": {"parts": [{"text": "hello world"}]}}]
    }))
    
    with patch("httpx.AsyncClient.post", mock_post):
        out = await p.run("hi")
        assert out == "hello world"
        
        args, kwargs = mock_post.call_args
        assert "key=fake-key" in args[0]
        payload = kwargs["json"]
        assert payload["contents"][0]["parts"][0]["text"] == "hi"

@pytest.mark.asyncio
async def test_run_with_system_prompt(monkeypatch):
    monkeypatch.setattr(secrets, "get_api_key", lambda x: "fake-key")
    p = GeminiProvider()
    
    mock_post = AsyncMock(return_value=_FakeResponse(json_data={
        "candidates": [{"content": {"parts": [{"text": "response"}]}}]
    }))
    
    with patch("httpx.AsyncClient.post", mock_post):
        await p.run("user prompt", system_prompt="system message")
        args, kwargs = mock_post.call_args
        payload = kwargs["json"]
        assert payload["system_instruction"]["parts"][0]["text"] == "system message"
        assert payload["contents"][0]["parts"][0]["text"] == "user prompt"

@pytest.mark.asyncio
async def test_run_with_attachments(monkeypatch, tmp_path):
    monkeypatch.setattr(secrets, "get_api_key", lambda x: "fake-key")
    p = GeminiProvider()
    
    img = tmp_path / "test.jpg"
    img.write_bytes(b"fake image data")
    
    mock_post = AsyncMock(return_value=_FakeResponse(json_data={
        "candidates": [{"content": {"parts": [{"text": "response"}]}}]
    }))
    
    with patch("httpx.AsyncClient.post", mock_post):
        await p.run("describe", attachments=[str(img)])
        args, kwargs = mock_post.call_args
        payload = kwargs["json"]
        parts = payload["contents"][0]["parts"]
        assert len(parts) == 2
        assert "inline_data" in parts[0]
        assert parts[0]["inline_data"]["mime_type"] == "image/jpeg"
        assert parts[0]["inline_data"]["data"] == base64.b64encode(b"fake image data").decode("utf-8")
        assert parts[1]["text"] == "describe"

@pytest.mark.asyncio
async def test_run_raises_when_key_missing(monkeypatch):
    monkeypatch.setattr(secrets, "get_api_key", lambda x: None)
    p = GeminiProvider()
    with pytest.raises(LLMError, match="API key is missing"):
        await p.run("hi")

@pytest.mark.asyncio
async def test_run_raises_on_http_error(monkeypatch):
    monkeypatch.setattr(secrets, "get_api_key", lambda x: "fake-key")
    p = GeminiProvider()
    
    mock_post = AsyncMock(return_value=_FakeResponse(status_code=400, text="Bad Request"))
    with patch("httpx.AsyncClient.post", mock_post):
        with pytest.raises(LLMError, match="HTTP 400"):
            await p.run("hi")

@pytest.mark.asyncio
async def test_run_handles_block_reason(monkeypatch):
    monkeypatch.setattr(secrets, "get_api_key", lambda x: "fake-key")
    p = GeminiProvider()
    
    mock_post = AsyncMock(return_value=_FakeResponse(json_data={
        "promptFeedback": {"blockReason": "SAFETY"}
    }))
    with patch("httpx.AsyncClient.post", mock_post):
        with pytest.raises(LLMError, match="SAFETY"):
            await p.run("hi")
