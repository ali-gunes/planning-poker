# Planning Poker Quotes System

This directory contains JSON files for the quotes system in the Planning Poker application.

## Available Files

- `ci-team.json`: Default quotes for the C&I team
- `sample-template.json`: A template you can use to create your own quotes
- `schema.json`: JSON Schema for validation

## How to Create Your Own Quotes

1. Download the `sample-template.json` file
2. Modify it with your team's information and quotes
3. Make sure your animation GIFs are placed in the `/public/gifs/` directory
4. Validate your JSON against the schema
5. Upload your JSON when selecting the "Özel" (Custom) option in the application

## Quote Categories

The quotes system supports different categories of quotes that are shown based on voting results:

- **medianLowQuotes**: Shown when the average vote is below the median of the voting cards
- **medianHighQuotes**: Shown when the average vote is above the median of the voting cards
- **generalQuotes**: Shown in general cases
- **consensusQuotes**: Shown when all team members vote the same
- **hugeDifferenceQuotes**: Shown when there's a significant difference between votes (max >= 3 * min)

## Settings

You can control when quotes are shown using the settings object:

```json
"settings": {
  "showOnGeneral": true,
  "showOnMedianLow": true,
  "showOnMedianHigh": true,
  "showOnConsensus": true,
  "showOnHugeDifference": true,
  "quoteProbability": 0.7
}
```

- Set any category to `false` to disable quotes for that scenario
- Adjust `quoteProbability` (0.0-1.0) to control how often quotes appear

## Quote Format

Each quote must follow this format:

```json
{
  "id": "unique-id",
  "name": "Team Member Name",
  "role": "Team Member Role",
  "quote": "The quote text goes here",
  "animation": "animation-file.gif",
  "color": "from-color-shade to-color-shade"
}
```

- `id`: A unique identifier for the team member
- `name`: The display name of the team member
- `role`: The role of the team member in the team
- `quote`: The actual quote text
- `animation`: Filename of a GIF in the `/public/gifs/` directory
- `color`: Tailwind CSS gradient colors for the modal background

## Color Options

You can use any Tailwind CSS color with shades from 50-900. Examples:

- `from-blue-500 to-cyan-600`
- `from-green-400 to-emerald-700`
- `from-red-500 to-orange-600`
- `from-purple-500 to-pink-600`
