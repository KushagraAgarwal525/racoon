/**
 * Custom error class for API errors with additional properties
 */
export class APIError extends Error {
  status: number;
  endpoint: string;
  
  constructor(message: string, status: number, endpoint: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

/**
 * Fetch data from API with error handling
 * @param url API endpoint URL
 * @param options Fetch options
 * @returns Promise with parsed JSON response
 * @throws APIError on failure
 */
export async function fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new APIError(
        `API returned ${response.status}: ${response.statusText}`,
        response.status,
        url
      );
    }
    
    return await response.json() as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Convert regular errors to APIError
    throw new APIError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      500,
      url
    );
  }
}
