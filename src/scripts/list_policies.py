import json
import os
import sys
from dotenv import load_dotenv
load_dotenv()

import chromadb


def _get_collection():
    client = chromadb.CloudClient(
        api_key=os.getenv("CHROMA_API_KEY"),
        tenant=os.getenv("CHROMA_TENANT"),
        database='dev'
    )
    return client.get_or_create_collection(name="policies")


def list_policies() -> list[dict]:
    """Return versions in descending order, each with their sorted document lines."""
    collection = _get_collection()
    result = collection.get(include=["documents", "metadatas"])

    versions: dict[int, dict] = {}
    for doc, meta in zip(result["documents"], result["metadatas"]):
        if not meta or "version" not in meta:
            continue
        v = meta["version"]
        if v not in versions:
            versions[v] = {
                "version": v,
                "filename": meta.get("filename", "unknown"),
                "uploaded_at": meta.get("uploaded_at", ""),
                "documents": [],
            }
        versions[v]["documents"].append({"line": meta.get("line", 0), "text": doc})

    for entry in versions.values():
        entry["documents"].sort(key=lambda d: d["line"])

    return sorted(versions.values(), key=lambda x: x["version"], reverse=True)


if __name__ == "__main__":
    print(json.dumps(list_policies()))
