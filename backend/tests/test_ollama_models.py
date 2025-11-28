#!/usr/bin/env python3
"""
Quick manual test script to verify the locally running Ollama models that the
backend depends on:

1. Generates an embedding for a sample guideline chunk using `embeddinggemma`.
2. Runs a short recommendation chat with `gemma3:1b`.

Usage:
    python backend/tests/test_ollama_models.py \
        --host http://localhost:11434 \
        --embed-model embeddinggemma \
        --llm-model gemma3:1b
"""
import argparse
import json
import sys
from typing import Any, Dict

import ollama


def build_client(host: str | None = None) -> ollama.Client:
    """Create an Ollama client pointing at the provided host."""
    if host:
        return ollama.Client(host=host)
    return ollama.Client()


def test_embeddings(client: ollama.Client, model: str) -> Dict[str, Any]:
    """Generate a single embedding to validate the embedding model."""
    sample_text = (
        "ADA 2025 guidelines state that metformin is the preferred first-line "
        "agent for most adults with type 2 diabetes, particularly when HbA1c "
        "is above individualized targets."
    )
    response = client.embeddings(model=model, prompt=sample_text)
    vector = response["embedding"]
    return {
        "model": model,
        "dimensions": len(vector),
        "preview": vector[:8],
    }


def test_chat(client: ollama.Client, model: str) -> Dict[str, Any]:
    """Run a short chat completion to validate the Gemma model."""
    system_prompt = (
        "You are a diabetes specialist. Answer using <= 3 bullet points."
    )
    user_prompt = (
        "Patient with type 2 diabetes, HbA1c 8.9%, eGFR 70, currently on "
        "metformin 1000mg BID. Suggest the next evidence-based therapy."
    )

    response = client.chat(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        options={"temperature": 0.2},
    )
    return {"model": model, "message": response["message"]["content"].strip()}


def main():
    parser = argparse.ArgumentParser(description="Test local Ollama models.")
    parser.add_argument("--host", default=None, help="Ollama host URL")
    parser.add_argument("--embed-model", default="embeddinggemma")
    parser.add_argument("--llm-model", default="gemma3:1b")
    args = parser.parse_args()

    try:
        client = build_client(args.host)
        embedding_result = test_embeddings(client, args.embed_model)
        llm_result = test_chat(client, args.llm_model)
    except Exception as exc:
        print(f"[FAIL] {exc}")
        sys.exit(1)

    print("[PASS] Ollama embedding model")
    print(json.dumps(embedding_result, indent=2))
    print("\n[PASS] Ollama chat model")
    print(json.dumps(llm_result, indent=2))


if __name__ == "__main__":
    main()


