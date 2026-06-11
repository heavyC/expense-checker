import os
from dotenv import load_dotenv
load_dotenv()

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
import chromadb
import uuid

def uploadExpensePolicy(filename):
    client = chromadb.CloudClient(
        api_key=os.getenv("CHROMA_API_KEY"),
        tenant=os.getenv("CHROMA_TENANT"),
        database='dev'
    )

    collection = client.get_or_create_collection(name="policies")
    try:
        f = open(filename, "r", encoding="utf-8")
        policies: list[str] = f.read().splitlines()
    except FileNotFoundError:
        print("File not Found")
        return(False, "File not found")

    print("Rows: ", len(policies))

    collection.add(
        ids=[str(uuid.uuid4()) for _ in policies],
        documents=policies,
        metadatas=[{"line":line} for line in range(len(policies))]
    )
    return(True, "success")


def main():
    print("Hello from expense-checker!")


if __name__ == "__main__":
    import sys
    filename = sys.argv[1] if len(sys.argv) > 1 else "policy2.txt"
    response = uploadExpensePolicy(filename)
    print(response)


# results = collection.query(
#     query_texts= [
#         "what is the return policy",
#         "can I return customized items?"
#     ],
#     n_results = 5
# )

# print(results)


# for i, results_enum in enumerate(results["documents"]):
#     print(f"\n {i}")
    # print("\n".join(results_enum))

# vectorstore = Chroma.from_documents(chunks, embedding=OpenAIEmbeddings())


