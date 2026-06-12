import os
import json
from dotenv import load_dotenv
load_dotenv()

import chromadb
import anthropic
from typing import TypedDict


class ExpenseState(TypedDict):
    expense: dict           # submitted expense data
    policy_excerpts: list   # retrieved from RAG
    verdict: str            # APPROVED / FLAGGED / NEEDS_REVIEW
    reasoning: str          # explanation
    policy_citations: list  # which policy sections apply
    confidence: float       # 0-1


class Expense(TypedDict):
    amount: float
    category: str
    vendor: str
    description: str
    chargeToCustomer: bool


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

    results = collection.query(query_texts=[query], n_results=8)

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

    prompt = f"""You are a corporate expense compliance analyst. Analyze the submitted expense against the company policy rules retrieved below, then respond with a JSON object only — no prose, no markdown fences.

EXPENSE:
  Amount:            ${expenseDict.get('amount', 0):.2f}
  Category:          {expenseDict.get('category', 'unknown')}
  Vendor:            {expenseDict.get('vendor', 'unknown')}
  Description:       {expenseDict.get('description', '')}
  Charge to Customer: {expenseDict.get('chargeToCustomer', False)}

POLICY RULES (retrieved from company policy database):
{policy_block}

Return exactly this JSON structure:
{{
  "verdict": "APPROVED" | "FLAGGED" | "NEEDS_REVIEW",
  "reasoning": "<detailed explanation referencing specific policy rules>",
  "policy_citations": ["<verbatim or paraphrased rule 1>", "..."],
  "confidence": <float 0.0-1.0>
}}

Verdict definitions:
- APPROVED: expense clearly complies with all applicable policies
- FLAGGED:  expense clearly violates one or more policies
- NEEDS_REVIEW: policy coverage is ambiguous, incomplete, or conflicting"""

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
            "verdict": "NEEDS_REVIEW",
            "reasoning": response_text,
            "policy_citations": [],
            "confidence": 0.5,
        }

    return ExpenseState(
        expense=expenseDict,
        policy_excerpts=[e["text"] for e in policy_excerpts],
        verdict=analysis.get("verdict", "NEEDS_REVIEW"),
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
        "chargeToCustomer": False,
    }
    result = analyzeExpense(sample)
    print(json.dumps(result, indent=2))
