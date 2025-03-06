/**
 * Service to interact with locally running Ollama models
 */
export class OllamaService {
  private baseUrl: string;
  private modelName: string;
  
  constructor(baseUrl = 'http://localhost:11434', modelName = 'deepseek-r1:1.5b') {
    this.baseUrl = baseUrl;
    this.modelName = modelName;
  }
  
  /**
   * Classifies user activity based on the given context
   */
  async classifyActivity(activityContext: ActivityContext): Promise<ActivityClassification> {
    try {
      const prompt = this.buildClassificationPrompt(activityContext);
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          prompt,
          stream: false,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseClassificationResponse(data.response);
    } catch (error) {
      console.error('Failed to classify activity:', error);
      // Return default classification if model fails
      return {
        category: 'unknown',
        productivityScore: 50,
        focusLevel: 'medium',
        description: 'Failed to classify activity',
      };
    }
  }
  
  private buildClassificationPrompt(context: ActivityContext): string {
    return `
      You are an AI assistant that classifies user productivity. Based on the following activity data from the past minute, classify the activity.
      
      Window title: ${context.windowTitle}
      Active application: ${context.activeApp}
      Keyboard activity: ${context.keyPressCount} keypresses
      Mouse activity: ${context.mouseMovementCount} movements, ${context.mouseClickCount} clicks
      URLs visited: ${context.urlsVisited.join(', ')}
      
      Respond with a valid JSON object containing:
      {
        "category": [one of: "work", "learning", "communication", "browsing", "entertainment", "development", "unknown"],
        "productivityScore": [number from 0 to 100],
        "focusLevel": [one of: "high", "medium", "low"],
        "description": [short description of the activity]
      }
    `;
  }
  
  private parseClassificationResponse(response: string): ActivityClassification {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        
        return {
          category: parsedData.category || 'unknown',
          productivityScore: parsedData.productivityScore || 50,
          focusLevel: parsedData.focusLevel || 'medium',
          description: parsedData.description || 'Unclassified activity'
        };
      }
      
      throw new Error('Could not extract JSON from response');
    } catch (error) {
      console.error('Failed to parse classification response:', error);
      return {
        category: 'unknown',
        productivityScore: 50,
        focusLevel: 'medium',
        description: 'Failed to parse activity classification',
      };
    }
  }
}

export interface ActivityContext {
  windowTitle: string;
  activeApp: string;
  keyPressCount: number;
  mouseMovementCount: number;
  mouseClickCount: number;
  urlsVisited: string[];
  timestamp: number;
}

export interface ActivityClassification {
  category: string;
  productivityScore: number;
  focusLevel: string;
  description: string;
}

// Create a singleton instance
const ollamaService = new OllamaService();
export default ollamaService;
