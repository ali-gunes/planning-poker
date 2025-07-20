/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

// jsonData is unknown incoming JSON parsed value
export async function validateQuoteSystem(jsonData: unknown): Promise<{ isValid: boolean; errors?: string[] }> {
  try {
    // First, check if it's valid JSON
    if (typeof jsonData !== 'object' || jsonData === null) {
      return { isValid: false, errors: ['Invalid JSON format'] };
    }

    const json = jsonData as Record<string, unknown>;

    const errors: string[] = [];

    const validateQuoteArray = (arr: any[], label: string) => {
      if (arr.length === 0) errors.push(`${label} array cannot be empty`);
      arr.forEach((quote: any, index: number) => {
        if (!quote.id) errors.push(`Quote ${index} in ${label} is missing id`);
        if (!quote.name) errors.push(`Quote ${index} in ${label} is missing name`);
        if (!quote.role) errors.push(`Quote ${index} in ${label} is missing role`);
        if (!quote.quote) errors.push(`Quote ${index} in ${label} is missing quote text`);
        if (quote.phrase !== undefined && typeof quote.phrase !== 'string') errors.push(`Invalid phrase in ${label}[${index}]`);
        if (!quote.animation) errors.push(`Quote ${index} in ${label} is missing animation`);
        if (!quote.color) errors.push(`Quote ${index} in ${label} is missing color`);
        if (quote.animation && typeof quote.animation === 'string' && !quote.animation.match(/^[a-zA-Z0-9_-]+\.gif$/)) errors.push(`Invalid animation format in ${label}[${index}]: ${quote.animation}`);
        if (quote.color && typeof quote.color === 'string' && !quote.color.match(/^from-[a-z]+-[0-9]+ to-[a-z]+-[0-9]+$/)) errors.push(`Invalid color format in ${label}[${index}]: ${quote.color}`);
      });
    };

    // New v2 structure: single quotes array
    if ('quotes' in json) {
      const arr = (json as any).quotes;
      if (!Array.isArray(arr) || arr.length === 0) {
        errors.push('quotes must be a non-empty array');
      } else {
        validateQuoteArray(arr, 'quotes');
      }
      // early return with new schema results
      return { isValid: errors.length === 0, errors: errors.length ? errors : undefined };
    }

    // Legacy structure fallback below

    const requiredProps = ['teamName','teamDescription','settings','medianLowQuotes','medianHighQuotes','generalQuotes','consensusQuotes','hugeDifferenceQuotes'];
    for (const prop of requiredProps) {
      if (!(prop in json)) errors.push(`Missing required property: ${prop}`);
    }

    // Settings validation
    const settings: Record<string, unknown> | undefined = (json as any).settings;
    if (settings) {
      const settingsProps = ['showOnGeneral', 'showOnMedianLow', 'showOnMedianHigh', 
                            'showOnConsensus', 'showOnHugeDifference', 'quoteProbability'];
      
      for (const prop of settingsProps) {
        if (settings[prop] === undefined) {
          errors.push(`Missing required setting: ${prop}`);
        }
      }
      
      // Check quoteProbability is between 0 and 1
      if (typeof settings.quoteProbability === 'number') {
        if (settings.quoteProbability < 0 || settings.quoteProbability > 1) {
          errors.push('quoteProbability must be between 0 and 1');
        }
      }
    }
    
    // Quote arrays validation
    const quoteArrays = ['medianLowQuotes', 'medianHighQuotes', 'generalQuotes', 
                        'consensusQuotes', 'hugeDifferenceQuotes'];
    
    for (const arrayName of quoteArrays) {
      const arr = (json as any)[arrayName];
      if (Array.isArray(arr)) {
        validateQuoteArray(arr, arrayName);
      } else if (arr !== undefined) errors.push(`${arrayName} must be an array`);
    }
    
    return { 
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    return { 
      isValid: false, 
      errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`] 
    };
  }
} 