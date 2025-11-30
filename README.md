# Installation

Download and install ollama with `brew install ollama` or by downloading an [installer](https://ollama.com/download/windows).

## Mac with Apple Silicon

1. ``./ollama-entrypoint.sh``  
2. ``docker compose up --no-deps open-webui``

## Windows/Linux

1. If an NVIDIA device is available uncomment section `ollama.deploy` of `docker-compose.yaml`
2. ``docker compose up``

To stop: ``docker compose down``

# Chrome Extension

1. Load ``chrome://extensions/``
2. Via `Load unpacked` select the project directory
3. Turn on the `Paragraph Summarizer` extension
4. Open some [news](https://finance.yahoo.com/) and see how summarization works by clicking on a paragraph

   - the first click usually takes longer to be processed

# Add a new model

By default, three models are downloaded: `llama3.1:8b`, `llama3.2:1b`, `llama3.2:3b`.
These are selectable in the extension's `Options` menu.

Load more models in `ollama_entrypoint.sh` or via `http://localhost:3000/admin/settings/models`.
Make sure new models are added to `options.html` and reload the extension.

# Create your own LLM endpoint with vLLM