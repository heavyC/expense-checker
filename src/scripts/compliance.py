import os
import json
import logging
import sys
from dotenv import load_dotenv
load_dotenv()

import chromadb
import anthropic
from typing import TypedDict

from prompts import DEFAULT_COMPLIANCE_ANALYSIS_PROMPT
from chroma_utils import get_current_policy_version

#  startup testing for 
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%dT%H:%M:%S',
    stream=sys.stderr,  # stdout is often used for actual data output, keep logs separate
)
logger = logging.getLogger(__name__)
logger.info("Python script started")
logger.info("Args received: %s", sys.argv[1:])
logger.info("Chroma Tenant: %s", os.getenv("CHROMA_TENANT"))


class ExpenseState(TypedDict):
    expense: dict           # submitted expense data
    policy_excerpts: list   # retrieved from RAG
    verdict: str            # APPROVED / FLAGGED
    reasoning: str          # explanation
    policy_citations: list  # which policy sections apply
    confidence: float       # 0-1


class Expense(TypedDict):
    amount: float
    category: str
    vendor: str
    description: str
    chargeToClient: bool


def _get_policy_excerpts(expense: dict) -> list[dict]:
    client = chromadb.CloudClient(
        api_key=os.getenv("CHROMA_API_KEY"),
        tenant=os.getenv("CHROMA_TENANT"),
        database='dev'
    )
    collection = client.get_or_create_collection(name="policies")

    query = (
        f"{expense.get('category', '')} expense: "
        f"{expense.get('description', '')} "
        f"at {expense.get('vendor', '')} "
        f"for ${expense.get('amount', 0):.2f}"
    )

    current_version = get_current_policy_version(collection)
    results = collection.query(
        query_texts=[query],
        n_results=8,
        where={"version": current_version} if current_version > 0 else None,
    )

    excerpts = []
    if results and results["documents"]:
        for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
            if doc.strip():
                excerpts.append({"text": doc, "metadata": meta})
    return excerpts


def analyzeExpense(expenseDict: dict) -> dict:
    policy_excerpts = _get_policy_excerpts(expenseDict)

    policy_block = (
        "\n".join(f"- {e['text']}" for e in policy_excerpts)
        if policy_excerpts
        else "No specific policy rules were found in the database."
    )

    prompt_template = expenseDict.pop("_prompt", None) or DEFAULT_COMPLIANCE_ANALYSIS_PROMPT
    prompt = prompt_template.format(
        amount=expenseDict.get('amount', 0),
        category=expenseDict.get('category', 'unknown'),
        vendor=expenseDict.get('vendor', 'unknown'),
        description=expenseDict.get('description', ''),
        charge_to_client=expenseDict.get('chargeToClient', False),
        approved_by_manager=expenseDict.get('approvedByManager', False),
        policy_block=policy_block,
    )

    ai = anthropic.Anthropic()

    response = ai.messages.create(
        model="claude-opus-4-8",
        max_tokens=1024,
        thinking={"type": "adaptive"},
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = next(
        (block.text for block in response.content if block.type == "text"), "{}"
    )

    try:
        analysis = json.loads(response_text)
    except json.JSONDecodeError:
        analysis = {
            "verdict": "FLAGGED",
            "reasoning": response_text,
            "policy_citations": [],
            "confidence": 0.5,
        }

    return ExpenseState(
        expense=expenseDict,
        policy_excerpts=[e["text"] for e in policy_excerpts],
        verdict=analysis.get("verdict", "FLAGGED"),
        reasoning=analysis.get("reasoning", ""),
        policy_citations=analysis.get("policy_citations", []),
        confidence=float(analysis.get("confidence", 0.5)),
    )


if __name__ == "__main__":
    sample = {
        "amount": 450.00,
        "category": "meals",
        "vendor": "Nobu Restaurant",
        "description": "client dinner with 3 guests",
        "chargeToClient": False,
    }
    result = analyzeExpense(sample)
    print(json.dumps(result, indent=2))
