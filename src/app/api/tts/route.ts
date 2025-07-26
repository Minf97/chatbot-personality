import { NextRequest, NextResponse } from 'next/server';
import { TTSRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const groupId = process.env.MINIMAX_GROUP_ID;
    const apiKey = process.env.MINIMAX_API_KEY;

    if (!groupId || !apiKey) {
      console.error('Missing API credentials:', { groupId: !!groupId, apiKey: !!apiKey });
      return NextResponse.json({ error: 'API credentials not configured' }, { status: 500 });
    }

    const ttsRequest: TTSRequest = {
      model: "speech-02-turbo",
      text: text.trim(),
      stream: false, // Try non-streaming first
      voice_setting: {
        voice_id: "male-qn-qingse",
        speed: 1.0,
        vol: 1.0,
        pitch: 0
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: "mp3",
        channel: 1
      }
    };

    // console.log('TTS Request:', { 
    //   text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    //   textLength: text.length 
    // });

    const url = `https://api.minimaxi.com/v1/t2a_v2?GroupId=${groupId}`;
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(ttsRequest)
    });

    // console.log('TTS API Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS API Error Response:', errorText);
      throw new Error(`TTS API error: ${response.status} - ${errorText}`);
    }

    // Handle non-streaming response
    if (!ttsRequest.stream) {
      const responseData = await response.json();
      // console.log('TTS Non-stream Response:', {
      //   hasData: !!responseData.data,
      //   hasAudio: !!(responseData.data && responseData.data.audio),
      //   audioLength: responseData.data?.audio?.length || 0
      // });

      if (!responseData.data || !responseData.data.audio) {
        console.error('No audio data in non-stream response');
        return NextResponse.json(
          { error: 'No audio data received from TTS service' },
          { status: 500 }
        );
      }

      const audioBytes = Buffer.from(responseData.data.audio, 'hex');
      // console.log('TTS Success (non-stream):', { audioLength: audioBytes.length });

      return new NextResponse(audioBytes, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBytes.length.toString(),
        },
      });
    }

    // Handle streaming response (original code)
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const audioChunks: Uint8Array[] = [];
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5));
              
              // Log the data structure for debugging
              if (process.env.NODE_ENV === 'development') {
                // console.log('TTS Stream Data:', {
                //   hasData: !!data.data,
                //   hasAudio: !!(data.data && data.data.audio),
                //   hasExtraInfo: !!data.extra_info,
                //   audioLength: data.data?.audio?.length || 0
                // });
              }
              
              if (data.data && data.data.audio && !data.extra_info) {
                const audioBytes = Buffer.from(data.data.audio, 'hex');
                audioChunks.push(new Uint8Array(audioBytes));
              }
            } catch {
              console.warn('Failed to parse TTS response line:', line.substring(0, 100));
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // console.log('TTS Processing Complete:', {
    //   chunksCount: audioChunks.length,
    //   totalBytes: audioChunks.reduce((sum, chunk) => sum + chunk.length, 0)
    // });

    // Check if we have any audio data
    if (audioChunks.length === 0) {
      console.error('No audio chunks received from TTS API');
      return NextResponse.json(
        { error: 'No audio data received from TTS service' },
        { status: 500 }
      );
    }

    // Combine all audio chunks
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    
    if (totalLength === 0) {
      console.error('Total audio length is 0');
      return NextResponse.json(
        { error: 'Empty audio data received from TTS service' },
        { status: 500 }
      );
    }

    const combinedAudio = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of audioChunks) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    // console.log('TTS Success (stream):', { audioLength: combinedAudio.length });

    return new NextResponse(combinedAudio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': combinedAudio.length.toString(),
      },
    });

  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate speech',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}