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
export class TunisianHolidaysPlugin extends BaseBlockPlugin<typeof SETTINGS> {
  template: PluginBlockTemplate = {
    patterns: ['holidays', 'Tunisian holidays', 'public holidays'],
    starts_conversation: true,
    name: 'Tunisian Holidays Plugin',
  };

  constructor(
    pluginService: PluginService,
    private readonly blockService: BlockService,
    private readonly settingService: SettingService,
  ) {
    super('tunisian-holidays-plugin', pluginService);
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
    const year = new Date().getFullYear();  // Current year
    const apiKey = 'YtlbVf6xvBFFTTDjMbMYno1bq6ITOKdJ';  // Replace with your Calendarific API key
    const apiUrl = `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=TN&year=${year}`;

    let responseMessage = '';

    try {
      // Fetch holiday data from the Calendarific API
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.response || !data.response.holidays) {
        responseMessage = 'No holidays found for Tunisia this year.';
        return this.createResponseMessage(responseMessage, context, settings);
      }

      // Get today's date
      const today = new Date();

      // Filter holidays that are in the future
      const upcomingHolidays = data.response.holidays.filter((holiday: any) => {
        const holidayDate = new Date(holiday.date.iso); // Cast string to Date object
        return holidayDate > today; // Filter out past holidays
      }).sort((a: any, b: any) => {
        const dateA = new Date(a.date.iso); // Convert string to Date
        const dateB = new Date(b.date.iso); // Convert string to Date
        return dateA.getTime() - dateB.getTime(); // Compare timestamps
      });

      // Get the first upcoming holiday
      const nextHoliday = upcomingHolidays[0];

      if (nextHoliday) {
        responseMessage =
          this.blockService.getRandom([...args.response_message]) +
          `\n` +
          `${nextHoliday.name} on ${nextHoliday.date.iso}`;
      } else {
        responseMessage = 'No upcoming public holidays found for Tunisia this year.';
      }
    } catch (error) {
      responseMessage = 'Sorry, I could not fetch the holidays at this time.';
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
