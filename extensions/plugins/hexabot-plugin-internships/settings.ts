import { PluginSetting } from '@/plugins/types';
import { SettingType } from '@/setting/schemas/types';

export default [
  {
    label: 'response_message',
    group: 'default',
    type: SettingType.multiple_text,
    value: [
      'Your CV is being processed...',
      'Finding the best internship matches for you...',
    ],
  },
] as const satisfies PluginSetting[];
