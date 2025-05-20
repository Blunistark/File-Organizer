import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_core.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from typing import List, Dict, Any
from fastapi.middleware.cors import CORSMiddleware
import json

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or "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"
MODEL_NAME = "openai/gpt-3.5-turbo"
OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"

llm = ChatOpenAI(
    model=MODEL_NAME,
    openai_api_key=OPENROUTER_API_KEY,
    openai_api_base=OPENROUTER_API_BASE,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or ["*"] for all origins (dev only)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Model 1: Context Analyzer ---

class AnalyzeRequest(BaseModel):
    content: str

class AnalyzeResponse(BaseModel):
    prompt: str

@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    # Try to parse the incoming content as a RAG context
    try:
        rag = json.loads(req.content)
        file_content = rag.get('fileContent', '')
        file_metadata = rag.get('fileMetadata', {})
        tags = rag.get('tags', [])
        similar_files = rag.get('similarFiles', [])
    except Exception:
        # Fallback: treat as plain content
        file_content = req.content
        file_metadata = {}
        tags = []
        similar_files = []

    # Build a rich context string for the LLM
    context_str = f"File Content:\n{file_content}\n\n"
    if file_metadata:
        context_str += f"File Metadata: {json.dumps(file_metadata, default=str)}\n"
    if tags:
        context_str += f"Tags: {', '.join(tags)}\n"
    if similar_files:
        context_str += "Similar Files (metadata):\n"
        for i, sim in enumerate(similar_files):
            context_str += f"  {i+1}. {json.dumps(sim, default=str)}\n"

    template = PromptTemplate(
        input_variables=["content"],
        template="Summarize the following file and its context (metadata, tags, similar files). Extract key topics and keywords, and generate a prompt for organization.\n\n{content}\n\nSummary:"
    )
    chain = LLMChain(llm=llm, prompt=template)
    try:
        result = chain.run({"content": context_str})
        return {"prompt": result.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Model 2: Organizer ---

# Request example:
# {
#   "prompt": "...",
#   "file_type": "pdf",
#   "user_context": {"department": "Finance", "project": "Q2 Reports", "preferences": "Confidential"},
#   "allowed_tags": ["finance", "report", "confidential"]
# }
class OrganizeRequest(BaseModel):
    prompt: str
    file_type: str = "text"
    user_context: dict = {}
    allowed_tags: list[str] = []

class OrganizeResponse(BaseModel):
    suggestedPath: str
    tags: list[str]
    tagConfidences: dict = {}
    summary: str
    confidence: float
    reasoning: str

# Prompt template selector
# Adds allowed_tags and tag confidence to the prompt
def get_prompt_template(file_type: str, user_context: dict, allowed_tags: list[str]):
    base = "Analyze the following file. Think step by step. First, summarize the content. Then, extract key topics. Finally, suggest the best folder path and tags."
    if file_type == "pdf":
        base = "This is a PDF document. " + base
    elif file_type == "image":
        base = "This is an image (OCR text provided). " + base
    elif file_type == "code":
        base = "This is a code file. " + base
    elif file_type == "spreadsheet":
        base = "This is a spreadsheet. " + base
    context_str = ""
    if user_context:
        context_str = "User context: " + ", ".join(f"{k}={v}" for k, v in user_context.items()) + "\n"
    tag_str = ""
    if allowed_tags:
        tag_str = f"Only suggest tags from this list: {', '.join(allowed_tags)}. If none fit, suggest a new tag. "
    return (
        f"{context_str}{base}\n{tag_str}\n\nFile content:\n{{content}}\n\nStep-by-step reasoning and JSON output:"
        "\nRespond in JSON with keys: suggestedPath, tags, tagConfidences (object with tag:confidence), summary, confidence, reasoning."
    )

@app.post("/api/organize", response_model=OrganizeResponse)
def organize(req: OrganizeRequest):
    template_str = get_prompt_template(req.file_type, req.user_context, req.allowed_tags)
    template = PromptTemplate(
        input_variables=["content"],
        template=template_str
    )
    chain = LLMChain(llm=llm, prompt=template)
    try:
        result = chain.run({"content": req.prompt})
        import json
        parsed = json.loads(result)
        return {
            "suggestedPath": parsed.get("suggestedPath", ""),
            "tags": parsed.get("tags", []),
            "tagConfidences": parsed.get("tagConfidences", {}),
            "summary": parsed.get("summary", ""),
            "confidence": float(parsed.get("confidence", 0)),
            "reasoning": parsed.get("reasoning", "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM or JSON error: {e}")

# --- Batch & Folder Organization ---

class BatchFileRequest(BaseModel):
    prompt: str
    file_type: str = "text"
    user_context: dict = {}
    allowed_tags: list[str] = []

class BatchOrganizeRequest(BaseModel):
    files: List[BatchFileRequest]

class BatchOrganizeResponse(BaseModel):
    results: List[OrganizeResponse]

@app.post("/api/organize/batch", response_model=BatchOrganizeResponse)
def organize_batch(req: BatchOrganizeRequest):
    results = []
    for file in req.files:
        template_str = get_prompt_template(file.file_type, file.user_context, file.allowed_tags)
        template = PromptTemplate(
            input_variables=["content"],
            template=template_str
        )
        chain = LLMChain(llm=llm, prompt=template)
        try:
            result = chain.run({"content": file.prompt})
            import json
            parsed = json.loads(result)
            results.append({
                "suggestedPath": parsed.get("suggestedPath", ""),
                "tags": parsed.get("tags", []),
                "tagConfidences": parsed.get("tagConfidences", {}),
                "summary": parsed.get("summary", ""),
                "confidence": float(parsed.get("confidence", 0)),
                "reasoning": parsed.get("reasoning", "")
            })
        except Exception as e:
            results.append({
                "suggestedPath": "",
                "tags": [],
                "tagConfidences": {},
                "summary": "",
                "confidence": 0.0,
                "reasoning": f"Error: {e}"
            })
    return {"results": results}

# Folder-level organization
# Request example:
# {
#   "file_prompts": ["...", "...", ...],
#   "user_context": {"department": "Finance", ...},
#   "allowed_tags": ["finance", "report", "confidential"],
#   "existing_folders": ["folder1", "folder2"],
#   "existing_tags": ["tag1", "tag2"]
# }
class FolderOrganizeRequest(BaseModel):
    file_prompts: List[str]
    user_context: dict = {}
    allowed_tags: list[str] = []
    existing_folders: list[str] = []
    existing_tags: list[str] = []

class AlternativeSuggestion(BaseModel):
    folderName: str
    tags: List[str]
    tagConfidences: Dict[str, float] = {}

class FolderOrganizeResponse(BaseModel):
    folderName: str
    tags: List[str]
    tagConfidences: dict = {}
    summary: str
    reasoning: str
    alternatives: List[AlternativeSuggestion] = []

@app.post("/api/organize/folder", response_model=FolderOrganizeResponse)
def organize_folder(req: FolderOrganizeRequest):
    context = "\n---\n".join(req.file_prompts)
    user_context = req.user_context
    allowed_tags = req.allowed_tags
    existing_folders = req.existing_folders
    existing_tags = req.existing_tags
    tag_str = f"Only suggest tags from this list: {', '.join(allowed_tags)}. If none fit, suggest a new tag. " if allowed_tags else ""
    folders_str = f"Existing folders: {', '.join(existing_folders)}\n" if existing_folders else ""
    tags_str = f"Existing tags: {', '.join(existing_tags)}\n" if existing_tags else ""
    template_str = (
        ("User context: " + ", ".join(f"{k}={v}" for k, v in user_context.items()) + "\n" if user_context else "") +
        folders_str +
        tags_str +
        f"Given the following files in a folder, think step by step. Summarize the group, suggest the best folder name, tags, tagConfidences (object with tag:confidence), summary, reasoning, and top 3 alternative folder/tag suggestions. {tag_str}\n\n"
        "Files:\n{content}\n\nStep-by-step reasoning and JSON output:\n"
        "Respond in JSON with keys: folderName, tags, tagConfidences, summary, reasoning, alternatives. Prefer to reuse existing folders and tags if appropriate."
    )
    template = PromptTemplate(
        input_variables=["content"],
        template=template_str
    )
    chain = LLMChain(llm=llm, prompt=template)
    try:
        result = chain.run({"content": context})
        import json
        parsed = json.loads(result)
        return {
            "folderName": parsed.get("folderName", ""),
            "tags": parsed.get("tags", []),
            "tagConfidences": parsed.get("tagConfidences", {}),
            "summary": parsed.get("summary", ""),
            "reasoning": parsed.get("reasoning", ""),
            "alternatives": parsed.get("alternatives", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM or JSON error: {e}")
