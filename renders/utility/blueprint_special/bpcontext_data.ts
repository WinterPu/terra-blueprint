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

export class BPParamContext{
  contextDecl = '';
  contextUsage = '';
  contextFree = '';

  constructor() {
    this.contextDecl = '';
    this.contextUsage = '';
    this.contextFree = '';
  }
}

export class BPMethodContext {
  contextParam_CppFromBP = new BPParamContext();
  contextParam_BPFromCpp = new BPParamContext();
  constructor() {
    this.contextParam_CppFromBP = new BPParamContext();
    this.contextParam_BPFromCpp = new BPParamContext();
  }
}
