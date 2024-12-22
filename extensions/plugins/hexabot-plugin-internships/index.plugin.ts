import { Block } from '@/chat/schemas/block.schema';
import { Context } from '@/chat/schemas/types/context';
import { OutgoingMessageFormat, StdOutgoingEnvelope, StdOutgoingTextEnvelope } from '@/chat/schemas/types/message';
import { BlockService } from '@/chat/services/block.service';
import { BaseBlockPlugin } from '@/plugins/base-block-plugin';
import { PluginService } from '@/plugins/plugins.service';
import { PluginBlockTemplate } from '@/plugins/types';
import { SettingService } from '@/setting/services/setting.service';
import { Injectable } from '@nestjs/common';
import axios from 'axios'; // For API requests
import * as pdftotext from 'node-pdftotext';

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

    // Dynamically check if files are available in context (if files are added elsewhere)
    const cvFile = context['files'] ? context['files'][0] : undefined; 

    if (!cvFile || cvFile.mimetype !== 'application/pdf') {
      return this.createResponseMessage(
        'Please upload a valid PDF file for your CV.',
        context,
        settings
      );
    }

    try {
      // Extract text from the uploaded PDF using pdftotext
      const pdfText = await this.extractTextFromPDF(cvFile.path);

      // Analyze the extracted text using Ollama's Dolphin-Phi model
      const skills = await this.analyzeCVWithOllama(pdfText);

      // Now search for internships based on the extracted skills/keywords
      const internships = await this.fetchInternshipOpportunities(skills);

      if (internships.length === 0) {
        return this.createResponseMessage(
          'Sorry, no internships match your qualifications at the moment.',
          context,
          settings
        );
      }

      // Format the internship listings into a readable list
      const internshipList = internships
        .map((job: any) => {
          return `- ${job.position} at ${job.company} - ${job.location}`;
        })
        .join('\n\n');

      const responseMessage =
        this.blockService.getRandom([...args.response_message]) +
        `\n\n` +
        internshipList;

      return this.createResponseMessage(responseMessage, context, settings);
    } catch (error) {
      console.error('Error processing CV or fetching internships:', error);
      return this.createResponseMessage(
        'Sorry, there was an issue processing your CV or finding internships.',
        context,
        settings
      );
    }
  }

  // Function to extract text from a PDF using pdftotext
  private extractTextFromPDF(pdfPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      pdftotext(pdfPath, (err, data) => {
        if (err) {
          reject('Error reading PDF file: ' + err);
        } else {
          resolve(data); // Return the extracted text
        }
      });
    });
  }

  // Function to analyze the CV text using Dolphin-Phi (Ollama)
  private async analyzeCVWithOllama(cvText: string): Promise<string[]> {
    const ollamaUrl = 'http://localhost:11434/v1/ollama/chat'; // Default URL for Ollama's local API
    try {
      const response = await axios.post(ollamaUrl, {
        model: 'dolphin-phi', // Specify the Dolphin-Phi model
        messages: [
          {
            role: 'user',
            content: `Extract relevant skills and keywords from the following CV text: \n\n${cvText}`,
          },
        ],
      });

      // Assuming the response contains a list of skills or keywords
      const skills = response.data?.choices[0]?.message?.content.split(',') || [];
      return skills;
    } catch (error) {
      console.error('Error analyzing CV with Ollama:', error);
      throw new Error('Error analyzing CV');
    }
  }

  // Function to fetch internship opportunities based on the extracted skills
  private async fetchInternshipOpportunities(skills: string[]): Promise<any[]> {
    const apiUrl = 'https://remoteok.io/api?tag=internship';
    let internshipList: any[] = [];

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      // Filter internships based on the extracted skills
      if (data && data.length > 0) {
        internshipList = data.filter((job: any) => {
          return skills.some((skill) =>
            job.position.toLowerCase().includes(skill.toLowerCase())
          );
        });
      }

      return internshipList;
    } catch (error) {
      console.error('Error fetching internship opportunities:', error);
      throw new Error('Error fetching internship opportunities');
    }
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
