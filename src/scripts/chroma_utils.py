def get_current_policy_version(collection) -> int:
    """Return the highest version number stored in the collection, or 0 if none exist."""
    result = collection.get(include=["metadatas"])
    versions = [m.get("version", 0) for m in result["metadatas"] if m]
    return max(versions, default=0)
