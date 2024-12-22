import { PluginSetting } from '@/plugins/types';
import { SettingType } from '@/setting/schemas/types';

const SETTINGS: PluginSetting[] = [
  {
    label: 'ollamaapiurl',
    group: ' default',
    type: SettingType.text, // Matches the type definition in PluginSetting
    value: ['http://localhost:11434/v1/ollama/chat',    ],
  },
  {
    label: 'scholarshipsapiurl',
    group: ' default',
    type: SettingType.text, // Text type for URL strings
    value: [ 'https://rapidapi.com/scholarshipsapi/v1/scholarships', ],
  },
  {
    label: 'scholarshipsApiKey',
    group: ' default',
    type: SettingType.text, // Use 'text' for API keys or sensitive information
    value: [ '1a242ec1a0msh773d5f0b5616ef0p1d7a93jsnf832f98b4bb2', ],
  },
  {
    label: 'response_message',
    group: ' default',
    type: SettingType.text, // Single-line text; adjust to 'textarea' if multiline is needed
    value: [ 'Here are the top scholarships I found for you:', ],
  }, 
];

export default SETTINGS;
