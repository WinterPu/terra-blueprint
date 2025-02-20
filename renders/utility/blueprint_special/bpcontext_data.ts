export class BPStructContext {
  contextConstructor = '';
  contextCreateRawData = '';
  contextFreeRawData = '';

  constructor() {
    this.contextConstructor = '';
    this.contextCreateRawData = '';
    this.contextFreeRawData = '';
  }
}

export class BPMethodContext {
  contextParamsCppFromBP = '';
  contextParamsBPFromCpp = '';

  constructor() {
    this.contextParamsCppFromBP = '';
    this.contextParamsBPFromCpp = '';
  }
}
