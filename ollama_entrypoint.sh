#!/bin/bash

set -e

export OLLAMA_ORIGINS=*
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_KV_CACHE_TYPE=q8_0
#export OLLAMA_NUM_THREADS=14
#export OLLAMA_NUM_GPU_LAYERS=31

ollama serve &

echo "⏳ Waiting for Ollama to start..."
sleep 10

echo "📥 Downloading models..."
ollama pull llama3.1:8b
ollama pull llama3.2:1b
ollama pull llama3.2:3b

echo "✅ Models ready!"

wait