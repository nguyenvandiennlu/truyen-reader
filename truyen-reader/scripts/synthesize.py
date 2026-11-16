import sys
import json
import asyncio
import base64
import edge_tts

async def run():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({"error": "Empty input"}))
            return
        input_data = json.loads(raw_input)
        text = input_data.get("text", "").strip()
        voice = input_data.get("voice", "vi-VN-NamMinhNeural")
        rate = input_data.get("rate", "+0%")

        if not text:
            print(json.dumps({"error": "Empty text"}))
            return

        communicate = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
        audio_chunks = []
        words = []

        async for chunk in communicate.stream():
            if chunk["type"] == "WordBoundary":
                words.append({
                    "text": chunk["text"],
                    "start": chunk["offset"] / 10000000.0,
                    "end": (chunk["offset"] + chunk["duration"]) / 10000000.0
                })
            elif chunk["type"] == "audio":
                audio_chunks.append(chunk["data"])

        # Tính toán charStart và charEnd của từng từ trong đoạn văn gốc
        search_idx = 0
        for w in words:
            pos = text.lower().find(w["text"].lower(), search_idx)
            if pos != -1:
                w["charStart"] = pos
                w["charEnd"] = pos + len(w["text"])
                search_idx = w["charEnd"]
            else:
                w["charStart"] = -1
                w["charEnd"] = -1

        audio_base64 = base64.b64encode(b"".join(audio_chunks)).decode("utf-8")
        result = {
            "audio": f"data:audio/mpeg;base64,{audio_base64}",
            "words": words
        }
        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    asyncio.run(run())
