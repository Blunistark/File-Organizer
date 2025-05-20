import openai

client = openai.OpenAI(
    api_key="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",
    base_url="https://openrouter.ai/api/v1"
)

response = client.chat.completions.create(
    model="openai/gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Say hello"}]
)
print(response)