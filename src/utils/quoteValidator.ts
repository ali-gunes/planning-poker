'use client';

import { QuoteSystem } from '@/types/quotes';

export async function validateQuoteSystem(jsonData: any): Promise<{ isValid: boolean; errors?: string[] }> {
  try {
    // First, check if it's valid JSON
    if (typeof jsonData !== 'object') {
      return { isValid: false, errors: ['Invalid JSON format'] };
    }

    // Load the schema
    const schemaResponse = await fetch('/quotes/schema.json');
    if (!schemaResponse.ok) {
      return { isValid: false, errors: ['Could not load validation schema'] };
    }
    
    const schema = await schemaResponse.json();
    
    // Basic structure validation
    const errors: string[] = [];
    
    // Required top-level properties
    const requiredProps = ['teamName', 'teamDescription', 'settings', 'medianLowQuotes', 
                          'medianHighQuotes', 'generalQuotes', 'consensusQuotes', 'hugeDifferenceQuotes'];
    
    for (const prop of requiredProps) {
      if (!jsonData[prop]) {
        errors.push(`Missing required property: ${prop}`);
      }
    }
    
    // Settings validation
    if (jsonData.settings) {
      const settingsProps = ['showOnGeneral', 'showOnMedianLow', 'showOnMedianHigh', 
                            'showOnConsensus', 'showOnHugeDifference', 'quoteProbability'];
      
      for (const prop of settingsProps) {
        if (jsonData.settings[prop] === undefined) {
          errors.push(`Missing required setting: ${prop}`);
        }
      }
      
      // Check quoteProbability is between 0 and 1
      if (typeof jsonData.settings.quoteProbability === 'number') {
        if (jsonData.settings.quoteProbability < 0 || jsonData.settings.quoteProbability > 1) {
          errors.push('quoteProbability must be between 0 and 1');
        }
      }
    }
    
    // Quote arrays validation
    const quoteArrays = ['medianLowQuotes', 'medianHighQuotes', 'generalQuotes', 
                        'consensusQuotes', 'hugeDifferenceQuotes'];
    
    for (const arrayName of quoteArrays) {
      if (Array.isArray(jsonData[arrayName])) {
        if (jsonData[arrayName].length === 0) {
          errors.push(`${arrayName} array cannot be empty`);
        }
        
        // Validate each quote item
        for (const [index, quote] of jsonData[arrayName].entries()) {
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
      } else if (jsonData[arrayName] !== undefined) {
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