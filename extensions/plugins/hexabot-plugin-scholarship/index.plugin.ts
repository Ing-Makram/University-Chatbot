import { Block } from '@/chat/schemas/block.schema';
import { Context } from '@/chat/schemas/types/context';
import {
  OutgoingMessageFormat,
  StdOutgoingEnvelope,
  StdOutgoingTextEnvelope,
} from '@/chat/schemas/types/message';
import { BlockService } from '@/chat/services/block.service';
import { BaseBlockPlugin } from '@/plugins/base-block-plugin';
import { PluginService } from '@/plugins/plugins.service';
import { PluginBlockTemplate } from '@/plugins/types';
import { SettingService } from '@/setting/services/setting.service';
import { Injectable } from '@nestjs/common';
import axios from 'axios'; // For API requests
import SETTINGS from './settings';

@Injectable()
export class ScholarshipOpportunitiesPlugin extends BaseBlockPlugin<typeof SETTINGS> {
  template: PluginBlockTemplate = {
    patterns: ['scholarships', 'scholarship opportunities', 'find scholarships'],
    starts_conversation: true,
    name: 'Scholarship Opportunities Plugin',
  };

  constructor(
    pluginService: PluginService,
    private readonly blockService: BlockService,
    private readonly settingService: SettingService,
  ) {
    super('scholarship-opportunities-plugin', pluginService);
  }

  getPath(): string {
    return __dirname;
  }

  async process(
    block: Block,
    context: Context,
    _convId: string,
  ): Promise<StdOutgoingEnvelope> {
    const settings = await this.settingService.getSettings();
    const args = this.getArguments(block);

    // URL for Ollama's Dolphin-Phi model
    const ollamaApiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434/v1/ollama/chat';
    const apiKey = process.env.SCHOLARSHIPS_API_KEY || '1a242ec1a0msh773d5f0b5616ef0p1d7a93jsnf832f98b4bb2';
    const scholarshipsApiUrl = process.env.SCHOLARSHIPS_API_URL || 'https://rapidapi.com/scholarshipsapi/v1/scholarships';

    let responseMessage = '';

    try {
      // Fetch scholarships data from RapidAPI
      const scholarshipsResponse = await axios.get(scholarshipsApiUrl, {
        headers: { 'X-RapidAPI-Key': apiKey },
      });

      const scholarships = scholarshipsResponse.data;
      if (!scholarships || scholarships.length === 0) {
        responseMessage = 'No scholarship opportunities found at the moment.';
        return this.createResponseMessage(responseMessage, context, settings);
      }

      // Send data to Ollama to process and summarize scholarships
      const ollamaResponse = await axios.post(ollamaApiUrl, {
        model: 'dolphin-phi',
        messages: [
          {
            role: 'user',
            content: `Here is a list of global scholarships. Summarize the top 5 most relevant ones: ${JSON.stringify(
              scholarships,
            )}`,
          },
        ],
      });

      const processedScholarships = ollamaResponse.data?.choices[0]?.message?.content;

      responseMessage =
        this.blockService.getRandom([...args.response_message]) +
        `\n\nTop Scholarships:\n\n${processedScholarships}`;
    } catch (error) {
      console.error('Error fetching scholarships or processing with Ollama:', error);
      //responseMessage = 'Sorry, I could not fetch the scholarship opportunities at this time.';
        responseMessage = error
    }

    return this.createResponseMessage(responseMessage, context, settings);
  }

  private createResponseMessage(
    message: string,
    context: Context,
    settings: any,
  ): StdOutgoingEnvelope {
    const msg: StdOutgoingTextEnvelope = {
      format: OutgoingMessageFormat.text,
      message: {
        text: this.blockService.processText(message, context, {}, settings),
      },
    };

    return msg;
  }
}
