export interface Channel {
  id: string;
  name: string;
  url: string;
  group?: string;
  logo?: string;
  country?: string;
  language?: string;
  tvgId?: string;
  tvgName?: string;
}

export interface ParsedPlaylist {
  channels: Channel[];
  totalChannels: number;
}

export class M3UParser {
  static async parseFromUrl(url: string): Promise<ParsedPlaylist> {
    try {
      const response = await fetch(url);
      const content = await response.text();
      return this.parseFromContent(content);
    } catch (error) {
      console.error('Error fetching M3U playlist:', error);
      throw new Error('Failed to fetch playlist');
    }
  }

  static parseFromContent(content: string): ParsedPlaylist {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const channels: Channel[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('#EXTINF:')) {
        const nextLine = lines[i + 1];
        if (nextLine && !nextLine.startsWith('#')) {
          const channel = this.parseExtInfLine(line, nextLine);
          if (channel) {
            channels.push(channel);
          }
          i++; // Skip the URL line as we've already processed it
        }
      }
    }

    return {
      channels,
      totalChannels: channels.length
    };
  }

  private static parseExtInfLine(extinfLine: string, urlLine: string): Channel | null {
    try {
      // Extract attributes from EXTINF line
      const attributes = this.extractAttributes(extinfLine);
      
      // Extract channel name (everything after the last comma)
      const nameMatch = extinfLine.match(/,([^,]*)$/);
      const name = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';
      
      // Generate a unique ID
      const id = this.generateChannelId(name, urlLine);

      return {
        id,
        name,
        url: urlLine.trim(),
        group: attributes['group-title'],
        logo: attributes['tvg-logo'],
        country: attributes['tvg-country'],
        language: attributes['tvg-language'],
        tvgId: attributes['tvg-id'],
        tvgName: attributes['tvg-name']
      };
    } catch (error) {
      console.error('Error parsing EXTINF line:', error);
      return null;
    }
  }

  private static extractAttributes(line: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    
    // Match attributes in format key="value" or key=value
    const attributeRegex = /(\w+(?:-\w+)*)=(?:"([^"]*)"|([^\s,]+))/g;
    let match;
    
    while ((match = attributeRegex.exec(line)) !== null) {
      const key = match[1];
      const value = match[2] || match[3] || '';
      attributes[key] = value;
    }
    
    return attributes;
  }

  private static generateChannelId(name: string, url: string): string {
    const combined = name + url;
    return btoa(combined).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  static groupChannelsByCategory(channels: Channel[]): Record<string, Channel[]> {
    const grouped: Record<string, Channel[]> = {};
    
    channels.forEach(channel => {
      const category = channel.group || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(channel);
    });
    
    return grouped;
  }

  static searchChannels(channels: Channel[], query: string): Channel[] {
    const lowerQuery = query.toLowerCase();
    return channels.filter(channel => 
      channel.name.toLowerCase().includes(lowerQuery) ||
      (channel.group && channel.group.toLowerCase().includes(lowerQuery)) ||
      (channel.country && channel.country.toLowerCase().includes(lowerQuery))
    );
  }
}