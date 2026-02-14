"""
Modal SDK Hello World
Run with: modal run scripts/modal_hello.py

Proves Modal connectivity for the sponsor prize track.
"""

import modal

app = modal.App("sentinel-test")


@app.function()
def hello():
    return "Sentinel + Modal is working!"


@app.local_entrypoint()
def main():
    result = hello.remote()
    print(f"Modal response: {result}")
