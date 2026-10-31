export type UsageMetadataValue =
  | string
  | number
  | boolean
  | null
  | UsageMetadataValue[]
  | { [key: string]: UsageMetadataValue };

export type UsageMetadata = Record<string, UsageMetadataValue>;
