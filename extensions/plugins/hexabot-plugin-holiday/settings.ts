import { PluginSetting } from '@/plugins/types';
import { SettingType } from '@/setting/schemas/types';

export default [
  {
    label: 'response_message',
    group: 'default',
    type: SettingType.multiple_text,
    value: [
      'The next public holiday in Tunisia is :',
      'These are the holidays you requested:',
      'Check out the next public holiday in Tunisia:',
    ],
  },
] as const satisfies PluginSetting[];