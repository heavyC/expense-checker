import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
load_dotenv()

import chromadb

from chroma_utils import get_current_policy_version

def _get_collection():
    client = chromadb.CloudClient(
        api_key=os.getenv("CHROMA_API_KEY"),
        tenant=os.getenv("CHROMA_TENANT"),
        database='dev'
    )
    return client.get_or_create_collection(name="policies")


def uploadExpensePolicy(filename: str) -> tuple[bool, str]:
    collection = _get_collection()

    try:
        with open(filename, "r", encoding="utf-8") as f:
            lines = [line for line in f.read().splitlines() if line.strip()]
    except FileNotFoundError:
        return (False, "File not found")

    new_version = get_current_policy_version(collection) + 1
    uploaded_at = datetime.now(timezone.utc).isoformat()
    basename = os.path.basename(filename)

    collection.add(
        ids=[str(uuid.uuid4()) for _ in lines],
        documents=lines,
        metadatas=[
            {
                "version": new_version,
                "filename": basename,
                "uploaded_at": uploaded_at,
                "line": i,
            }
            for i, _ in enumerate(lines)
        ],
    )

    msg = f"Uploaded version {new_version} ({len(lines)} chunks) from '{basename}'"
    print(msg)
    return (True, msg)


def list_policy_versions(collection=None) -> list[dict]:
    """Return one summary dict per version: version, filename, uploaded_at, chunk_count."""
    if collection is None:
        collection = _get_collection()

    result = collection.get(include=["metadatas"])
    versions: dict[int, dict] = {}
    for metadatum in result["metadatas"]:
        if not metadatum or "version" not in metadatum:
            continue
        v = metadatum["version"]
        if v not in versions:
            versions[v] = {
                "version": v,
                "filename": metadatum.get("filename", "unknown"),
                "uploaded_at": metadatum.get("uploaded_at", "unknown"),
                "chunk_count": 0,
            }
        versions[v]["chunk_count"] += 1

    return sorted(versions.values(), key=lambda x: x["version"])


if __name__ == "__main__":
    import sys
    filename = sys.argv[1] if len(sys.argv) > 1 else "policy2.txt"
    uploadExpensePolicy(filename)
