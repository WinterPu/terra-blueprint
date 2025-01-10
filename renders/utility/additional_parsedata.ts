
// Define custom user data for code generation

export type CXXFileUserData = {
    fileName: string;
  };

export type TerraNodeUserData = {
    isStruct: boolean;
    isEnumz: boolean;
    isClazz: boolean;
    isCallback: boolean;
    hasBaseClazzs: boolean;
    hasSupportApi: boolean;
    prefix_name: string;

    fullTypeWithNamespace: string;
    commentCppStyle: string;

    // bp
    bpNodeName: string;
    bpHasRegistered: boolean; // if the node is class, struct, enum, it would be registered first.
    lenEnumConstants: number;
    bpIsCallback: boolean;
    bpGenEnumConversionFunction: string;

};

export type ClazzMethodUserData = {
    hasConditionalDirective: boolean;
    isExcluded: boolean;
    failureReturnVal: string
    hasReturnVal: boolean
    hasParameters: boolean;
    isRegisterMethod: boolean;
    isSupport: boolean;
    bindingEventExtension: [];
    bindingExtension: [];

    macro_scope_start: string;
    macro_scope_end: string;
    commentCppStyle: string;
    isFirst: boolean;
    isLast: boolean;
    isExMethod:boolean;
    callerInstanceName:string;


    // bp
    bpReturnType: string;
    bpMethodName: string;
    bpCallbackDelegateMacroName: string;
    bpCallbackDelegateTypeName: string;
    bpCallbackDelegateVarName: string;
    bpIsNoParamCallback: boolean;
};


export type EnumConstantsUserData = {
    commentCppStyle: string;
    isFirst: boolean;
    isLast: boolean;
};

export type StructMemberVariableUserData = {
    commentCppStyle: string;
    isFirst: boolean;
    isLast: boolean;

    // bp
    bpType: string;
    bpIsUStruct: boolean;

    bpNeedConvTo: boolean;
    bpNameConvFuncTo: string;

    bpNeedConvFrom: boolean;
    bpNeedConvFromMemoAlloc: boolean;
    bpNeedConvFromSetData: boolean;
    bpNameConvFuncFrom: string;
    bpNameConvFuncFromAdditional: string;


    bpNeedDefaultValue: boolean;
    bpDefaultValue: string;
};

export type ParameterUserData = {
    lenParameters: number;
    commentCppStyle: string;
    isFirst: boolean;
    isLast: boolean;
    
    // bp
    bpParameterType: string;
};


//////// Define Custom UserData