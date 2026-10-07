"""
llm_factory.py — one adapter, four providers.

A single ``LLMClient.complete(...)`` call works the same regardless of whether
the backing provider is OpenAI, Google Gemini, Groq or Anthropic Claude. The
provider is chosen (in order of precedence):

    1. explicit ``provider=`` argument to ``get_llm()``
    2. the ``LLM_PROVIDER`` env var (via ``settings.llm_provider``)

Only ``requests`` is required — no provider SDKs. Groq and OpenAI share the
OpenAI-compatible ``/chat/completions`` schema, so they use one code path.

If a call fails (bad key, network, quota) the error is raised as ``LLMError``;
callers that have a deterministic fallback (e.g. the aptitude question bank)
catch it and degrade gracefully.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Optional

import requests

from config import settings

logger = logging.getLogger("jobjugad.llm")

_ALIASES = {"claude": "anthropic"}
SUPPORTED = ("openai", "gemini", "groq", "anthropic")


class LLMError(RuntimeError):
    """Raised when a provider call cannot be completed."""


def _normalise(provider: Optional[str]) -> str:
    p = (provider or settings.llm_provider or "groq").strip().lower()
    return _ALIASES.get(p, p)


class LLMClient:
    """Thin unified chat client. Instantiate via :func:`get_llm`."""

    def __init__(self, provider: str, api_key: str, model: str, timeout: int):
        self.provider = provider
        self.api_key = api_key
        self.model = model
        self.timeout = timeout

    # ── public API ────────────────────────────────────────────────────────
    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    def complete(
        self,
        prompt: str,
        system: str = "You are a helpful assistant.",
        *,
        json_mode: bool = False,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> str:
        if not self.api_key:
            raise LLMError(f"No API key configured for provider '{self.provider}'.")
        try:
            if self.provider in ("openai", "groq"):
                return self._openai_compatible(
                    prompt, system, json_mode, temperature, max_tokens
                )
            if self.provider == "gemini":
                return self._gemini(prompt, system, json_mode, temperature, max_tokens)
            if self.provider == "anthropic":
                return self._anthropic(prompt, system, temperature, max_tokens)
            raise LLMError(f"Unknown provider '{self.provider}'.")
        except requests.RequestException as exc:
            raise LLMError(f"{self.provider} request failed: {exc}") from exc

    def complete_json(self, prompt: str, system: str = "Return valid JSON only.", **kw) -> dict:
        raw = self.complete(prompt, system, json_mode=True, **kw)
        return extract_json(raw)

    # ── provider implementations ─────────────────────────────────────────
    def _openai_compatible(self, prompt, system, json_mode, temperature, max_tokens) -> str:
        base = (
            "https://api.groq.com/openai/v1"
            if self.provider == "groq"
            else "https://api.openai.com/v1"
        )
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        res = requests.post(
            f"{base}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=self.timeout,
        )
        if res.status_code != 200:
            raise LLMError(f"{self.provider} {res.status_code}: {res.text[:400]}")
        return res.json()["choices"][0]["message"]["content"] or ""

    def _gemini(self, prompt, system, json_mode, temperature, max_tokens) -> str:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )
        # Gemini 3.x are thinking models — reasoning eats into maxOutputTokens, so
        # keep a generous floor to leave room for an actual answer.
        gen_cfg = {"temperature": temperature, "maxOutputTokens": max(max_tokens, 1024)}
        if json_mode:
            gen_cfg["responseMimeType"] = "application/json"
        payload = {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": gen_cfg,
        }
        res = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=self.timeout,
        )
        if res.status_code != 200:
            raise LLMError(f"gemini {res.status_code}: {res.text[:400]}")
        data = res.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"] or ""
        except (KeyError, IndexError) as exc:
            raise LLMError(f"gemini: unexpected response shape {data}") from exc

    def _anthropic(self, prompt, system, temperature, max_tokens) -> str:
        res = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "system": system,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=self.timeout,
        )
        if res.status_code != 200:
            raise LLMError(f"anthropic {res.status_code}: {res.text[:400]}")
        parts = res.json().get("content", [])
        return "".join(p.get("text", "") for p in parts if p.get("type") == "text")


def get_llm(provider: Optional[str] = None, api_key: Optional[str] = None) -> LLMClient:
    """Build a client for ``provider`` (or the configured default)."""
    prov = _normalise(provider)
    if prov not in SUPPORTED:
        logger.warning("Unknown LLM provider %r, falling back to groq", prov)
        prov = "groq"
    return LLMClient(
        provider=prov,
        api_key=(api_key or settings.api_key_for(prov)).strip(),
        model=settings.model_for(prov),
        timeout=settings.request_timeout,
    )


# ── JSON helpers (LLMs love to wrap JSON in prose / markdown) ─────────────
def extract_json(raw: Optional[str]) -> dict:
    if not raw:
        return {}
    text = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text).strip()
        if text.endswith("```"):
            text = text[:-3].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return {"raw_response": raw}
