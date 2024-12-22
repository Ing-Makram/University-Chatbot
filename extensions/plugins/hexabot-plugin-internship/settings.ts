import { PluginSetting } from '@/plugins/types';
import { SettingType } from '@/setting/schemas/types';

export default [
  {
    label: 'response_message',
    group: 'default',
    type: SettingType.multiple_text,
    value: [
      'Here are some current internship opportunities (top 10) :',
      'Best current internship opportunities :',
    ],
  },
] as const satisfies PluginSetting[];