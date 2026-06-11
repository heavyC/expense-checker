import os
from dotenv import load_dotenv
load_dotenv()

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
import chromadb
import uuid

from langgraph.graph import StateGraph
from typing import TypedDict, Literal

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
    

def analyzeExpense(expenseDict):
    print("hello, world")
    print(expenseDict)
    return "expense received: " + expenseDict["description"]


def main():
    print("Hello from expense-checker!")


if __name__ == "__main__":
    import sys
    expense = {
        "amount": 10.00,
        "category": "meals",
        "vendor": "Nobu Restaurant",
        "description": "team lunch"
    }
    filename = sys.argv[1] if len(sys.argv) > 1 else "policy2.txt"
    response = analyzeExpense(expense)
    print(response)
