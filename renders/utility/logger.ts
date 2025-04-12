export function PrintStageLog(message: string): void {
  console.log(` ============ UESDKLog - Stage: ${message} ============ `);
}

export function PrintError(message: string): void {
  console.error(`[*** UESDKError ***]: ${message}`);
}

export function PrintWarn(message: string): void {
  console.warn(`[*** UESDKWarning ***]: ${message}`);
}