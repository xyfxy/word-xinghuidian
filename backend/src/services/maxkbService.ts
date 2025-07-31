import axios from 'axios';

interface MaxKbMessage {
  role: string;
  content: string;
}

export async function generateMaxKbContent(
  baseUrl: string,
  apiKey: string,
  messages: MaxKbMessage[],
  model: string = 'gpt-3.5-turbo', // Default model, can be overridden
  maxTokens?: number
): Promise<string> {
  if (!baseUrl || !apiKey) {
    throw new Error('MaxKB base URL and API Key are required.');
  }

  // 智能拼接URL，避免重复添加路径
  let url = baseUrl;
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (!url.endsWith('/chat/completions')) {
    url = `${url}/chat/completions`;
  }

  // 确保max_tokens在有效范围内（1-8192）
  let validMaxTokens: number | undefined;
  if (maxTokens !== undefined) {
    validMaxTokens = Math.max(1, Math.min(8192, maxTokens));
  }

  const requestBody: any = {
    model,
    messages,
    stream: false, // As per MaxKB docs, use false for non-streaming
  };

  // 只在提供了maxTokens时才添加该参数
  if (validMaxTokens !== undefined) {
    requestBody.max_tokens = validMaxTokens;
  }

  const requestHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  /*
  console.log('--- Sending MaxKB API Request ---');
  console.log('URL:', url);
  console.log('Headers:', { ...requestHeaders, Authorization: `Bearer ${apiKey.substring(0, 15)}...`}); // Mask API key for safety
  console.log('Body:', JSON.stringify(requestBody, null, 2));
  console.log('---------------------------------');
  */

  try {
    const response = await axios.post(
      url,
      requestBody,
      { 
        headers: requestHeaders,
        timeout: 120000 // 120秒超时
      }
    );

    if (response.status === 200 && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      console.error('MaxKB API Error:', response.data);
      throw new Error(
        `Failed to generate content from MaxKB. Status: ${response.status}, Response: ${JSON.stringify(response.data)}`
      );
    }
  } catch (error) {
    console.error('Error calling MaxKB API:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`MaxKB API request failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
} 