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

    // Basic structure validation
    const errors: string[] = [];
    
    // Required top-level properties
    const requiredProps = ['teamName', 'teamDescription', 'settings', 'medianLowQuotes', 
                          'medianHighQuotes', 'generalQuotes', 'consensusQuotes', 'hugeDifferenceQuotes'];
    
    for (const prop of requiredProps) {
      if (!(prop in json)) {
        errors.push(`Missing required property: ${prop}`);
      }
    }
    
    // Settings validation
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
        if (arr.length === 0) {
          errors.push(`${arrayName} array cannot be empty`);
        }
        
        // Validate each quote item
        for (const [index, quote] of arr.entries()) {
          if (!quote.id) errors.push(`Quote ${index} in ${arrayName} is missing id`);
          if (!quote.name) errors.push(`Quote ${index} in ${arrayName} is missing name`);
          if (!quote.role) errors.push(`Quote ${index} in ${arrayName} is missing role`);
          if (!quote.quote) errors.push(`Quote ${index} in ${arrayName} is missing quote text`);
          if (quote.phrase !== undefined && typeof quote.phrase !== 'string') {
            errors.push(`Invalid phrase in ${arrayName}[${index}]`);
          }
          if (!quote.animation) errors.push(`Quote ${index} in ${arrayName} is missing animation`);
          if (!quote.color) errors.push(`Quote ${index} in ${arrayName} is missing color`);
          
          // Validate animation format
          if (quote.animation && typeof quote.animation === 'string') {
            if (!quote.animation.match(/^[a-zA-Z0-9_-]+\.gif$/)) {
              errors.push(`Invalid animation format in ${arrayName}[${index}]: ${quote.animation}`);
            }
          }
          
          // Validate color format
          if (quote.color && typeof quote.color === 'string') {
            if (!quote.color.match(/^from-[a-z]+-[0-9]+ to-[a-z]+-[0-9]+$/)) {
              errors.push(`Invalid color format in ${arrayName}[${index}]: ${quote.color}`);
            }
          }
        }
      } else if (arr !== undefined) {
        errors.push(`${arrayName} must be an array`);
      }
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