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

import SETTINGS from './settings';

@Injectable()
export class InternshipOpportunitiesPlugin extends BaseBlockPlugin<typeof SETTINGS> {
  template: PluginBlockTemplate = {
    patterns: ['internships', 'internship opportunities', 'find internships'],
    starts_conversation: true,
    name: 'Internship Opportunities Plugin',
  };

  constructor(
    pluginService: PluginService,
    private readonly blockService: BlockService,
    private readonly settingService: SettingService,
  ) {
    super('internship-opportunities-plugin', pluginService);
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

    // Remote OK API URL for internship listings (only top 10 results)
    const apiUrl = 'https://remoteok.io/api?tag=internship';

    let responseMessage = '';

    try {
      // Fetch internship data from Remote OK API
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data || data.length === 0) {
        responseMessage = 'No internship opportunities found at the moment.';
        return this.createResponseMessage(responseMessage, context, settings);
      }

      // Slice to get the first 10 results
      const top10Internships = data.slice(0, 10);

      // Format the internship listings into a readable list
      const internshipList = top10Internships
      .map((job: any) => {
        return `- ${job.position} at ${job.company} - ${job.location}`;
      })
      .join('\n\n');
    

      responseMessage =
        this.blockService.getRandom([...args.response_message]) +
        `\n\n` +
        internshipList;
    } catch (error) {
      responseMessage = 'Sorry, I could not fetch the internship opportunities at this time.';
    }

    return this.createResponseMessage(responseMessage, context, settings);
  }

  private createResponseMessage(
    message: string,
    context: Context,
    settings: any
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
