
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

    commentCppStyle: string;
    isFirst: boolean;
    isLast: boolean;


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

    bpType: string;
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