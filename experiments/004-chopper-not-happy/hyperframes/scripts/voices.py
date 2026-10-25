"""Generic Chinese TTS for an original fan performance; no actor voice cloning."""
import asyncio
import os
from pathlib import Path
import edge_tts
import edge_tts.communicate
edge_tts.communicate._SSL_CTX.load_default_certs()
ROOT=Path(__file__).resolve().parent.parent
async def main():
    await edge_tts.Communicate('乔巴，你真厉害！','zh-CN-XiaoxiaoNeural',rate='+8%',pitch='+3Hz',proxy=os.environ.get('HTTPS_PROXY')).save(str(ROOT/'assets/praise.mp3'))
    await edge_tts.Communicate('才、才没有高兴呢！','zh-CN-XiaoyiNeural',rate='+12%',pitch='+35Hz',proxy=os.environ.get('HTTPS_PROXY')).save(str(ROOT/'assets/deny.mp3'))
asyncio.run(main())
